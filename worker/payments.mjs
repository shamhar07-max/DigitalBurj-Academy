import {teachingFulfilment,teachingRevocation} from './teaching.mjs';
import {receiptSnapshot} from './receipts.mjs';
const paymentJSON=(body,status=200)=>new Response(JSON.stringify(body),{status,headers:{'content-type':'application/json','cache-control':'no-store'}});
export async function handlePayments(r,env,verify){
 if(!env.STRIPE_WEBHOOK_SECRET||!env.DB)return paymentJSON({error:'Payment service is not configured.'},503);
 const raw=await r.text();if(raw.length>2000000)return paymentJSON({error:'Webhook too large.'},413);
 if(!await verify(raw,r.headers.get('stripe-signature'),env.STRIPE_WEBHOOK_SECRET))return paymentJSON({error:'Invalid payment signature.'},400);
 let event;try{event=JSON.parse(raw)}catch{return paymentJSON({error:'Invalid JSON.'},400)}
 if(!event.id||!event.type||!event.data?.object)return paymentJSON({error:'Invalid event.'},400);
 const db=env.DB,s=(q,...a)=>db.prepare(q).bind(...a),one=(q,...a)=>s(q,...a).first(),now=new Date().toISOString(),obj=event.data.object;
 if(await one('SELECT id FROM payment_events WHERE id=?',event.id))return paymentJSON({received:true,duplicate:true});
 const changes=[];
 if(['checkout.session.completed','checkout.session.async_payment_succeeded'].includes(event.type)&&obj.payment_status==='paid'){
  const order=await one('SELECT * FROM orders WHERE session_id=?',obj.id),scope=order&&await one('SELECT * FROM order_access WHERE order_id=?',order.id);
  if(!order||!scope||order.amount!==obj.amount_total||order.currency!==obj.currency||obj.client_reference_id!==order.id||!['Awaiting payment','Paid'].includes(order.status))return paymentJSON({error:'Payment cannot be matched to an eligible order.'},409);
  let courses;try{courses=JSON.parse(scope.scopes)}catch{return paymentJSON({error:'Invalid stored purchase scope.'},409)}
  const expires=new Date(Date.now()+scope.duration_days*86400000).toISOString();
  changes.push(s("UPDATE orders SET status='Paid' WHERE id=? AND status='Awaiting payment'",order.id));
  changes.push(s("INSERT OR IGNORE INTO payment_receipts(order_id,body,refunded_amount) SELECT ?,?,0 WHERE EXISTS(SELECT 1 FROM orders WHERE id=? AND status='Paid')",order.id,JSON.stringify(receiptSnapshot(order,scope,now)),order.id));
  for(const course of courses)changes.push(s("INSERT OR IGNORE INTO entitlements(id,user_id,course_id,source_id,status,expires,created) SELECT ?,?,?,?,'Active',?,? WHERE EXISTS(SELECT 1 FROM orders WHERE id=? AND status='Paid')",crypto.randomUUID(),order.user_id,course,order.id,expires,now,order.id));
  changes.push(...teachingFulfilment(db,order,scope,now));
  const intent=typeof obj.payment_intent==='string'?obj.payment_intent:obj.payment_intent?.id;if(intent)changes.push(s('INSERT OR IGNORE INTO payment_links(payment_intent,order_id) VALUES(?,?)',intent,order.id));
 }
 if(event.type==='checkout.session.expired')changes.push(s("UPDATE orders SET status='Expired' WHERE session_id=? AND status='Awaiting payment'",obj.id));
 if(event.type==='charge.refunded'||event.type==='charge.dispute.created'){
  const intent=typeof obj.payment_intent==='string'?obj.payment_intent:obj.payment_intent?.id;
  if(!intent)return paymentJSON({error:'Payment intent is required to reconcile this event.'},409);
  const link=await one('SELECT order_id FROM payment_links WHERE payment_intent=?',intent);
  // Retry if the payment event has not yet arrived; do not acknowledge and lose revocation.
  if(!link)return paymentJSON({error:'Original payment is not reconciled yet. Retry this event.'},409);
  if(event.type==='charge.refunded'){
   const order=await one('SELECT * FROM orders WHERE id=?',link.order_id);
   if(!order||!Number.isInteger(obj.amount_refunded)||obj.amount_refunded<0||obj.amount_refunded>order.amount||obj.amount!==order.amount||(obj.currency&&obj.currency!==order.currency))return paymentJSON({error:'Refund does not match the recorded payment.'},409);
   changes.push(s('UPDATE payment_receipts SET refunded_amount=MAX(refunded_amount,?) WHERE order_id=?',obj.amount_refunded,order.id));
   if(obj.amount_refunded>0&&obj.amount_refunded<order.amount)changes.push(s("UPDATE orders SET status='Partially refunded' WHERE id=? AND status='Paid'",order.id));
  }
  if(event.type==='charge.dispute.created'||obj.refunded===true||obj.amount_refunded>=obj.amount){
   const state=event.type==='charge.dispute.created'?'Disputed':'Refunded';
   changes.push(s('UPDATE orders SET status=? WHERE id=?',state,link.order_id),s("UPDATE entitlements SET status='Revoked' WHERE source_id=?",link.order_id),...teachingRevocation(db,link.order_id,now));
  }
 }
 changes.push(s('INSERT INTO payment_events(id,body,created) VALUES(?,?,?)',event.id,JSON.stringify({type:event.type,id:obj.id}),now),s('INSERT INTO audit(id,actor,action,record,details,created) VALUES(?,?,?,?,?,?)',crypto.randomUUID(),'payment-provider','payment_event_reconciled',event.id,JSON.stringify({type:event.type}),now));
 try{await db.batch(changes);return paymentJSON({received:true})}catch{if(await one('SELECT id FROM payment_events WHERE id=?',event.id))return paymentJSON({received:true,duplicate:true});return paymentJSON({error:'Reconciliation could not complete. Retry the event.'},503)}
}
