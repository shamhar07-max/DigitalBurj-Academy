import qrcode from 'qrcode-generator';
import JsBarcode from 'jsbarcode';
window.CertificateCodes={
 qr(url){const q=qrcode(0,'M');q.addData(url,'Byte');q.make();return q.createSvgTag({cellSize:3,margin:12,scalable:true});},
 barcode(element,id){JsBarcode(element,id,{format:'CODE128',displayValue:false,height:35,width:1,margin:10,background:'#ffffff',lineColor:'#000000'});}
};
