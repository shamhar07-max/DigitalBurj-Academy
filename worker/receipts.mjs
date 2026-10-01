export async function readOrderReceipt(db, orderId, userId) {
  const order = await db.prepare('SELECT id,product_id,status,amount,currency,created FROM orders WHERE id=? AND user_id=?').bind(orderId,userId).first();
  if (!order) return null;
  const scope = await db.prepare('SELECT * FROM order_access WHERE order_id=?').bind(order.id).first();
  const record = await db.prepare('SELECT body,refunded_amount FROM payment_receipts WHERE order_id=?').bind(order.id).first();
  const access = await db.prepare("SELECT course_id FROM entitlements WHERE user_id=? AND source_id=? AND status='Active' AND (expires IS NULL OR expires>?)").bind(userId,order.id,new Date().toISOString()).all();
  return {...order,title:scope?.product_title||order.product_id,courseIds:JSON.parse(scope?.scopes||'[]'),activeCourseIds:(access.results||[]).map(x=>x.course_id),receipt:record?{...JSON.parse(record.body),refundedAmount:record.refunded_amount}:null};
}

export function receiptSnapshot(order, scope, confirmedAt) {
  return {number:'DBR-'+order.id.replace(/^order-/,''),orderId:order.id,title:scope.product_title||order.product_id,amount:order.amount,currency:order.currency,confirmedAt,courseIds:JSON.parse(scope.scopes),durationDays:scope.duration_days,issuer:'DigitalBurj Academy',documentType:'Payment receipt'};
}
