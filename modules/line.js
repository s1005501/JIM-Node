const express = require('express')
const router = express.Router()
const upload = require('./upload')
const db = require('./db_connect')
const bcrypt = require('bcrypt')

const { HmacSHA256 } = require('crypto-js')
const Base64 = require('crypto-js/enc-base64')
const {
    LINEPAY_CHANNEL_ID,
    LINEPAY_CHANNEL_SECRET_KEY,
    LINEPAY_VERSION,
    LINEPAY_SITE,
    LINEPAY_RETURN_HOST,
    LINEPAY_RETURN_CONFIRM_URL,
    LINEPAY_RETURN_CANCEL_URL,
} = process.env
const orders = require('./../data/sampleData')
const { default: axios } = require('axios')


router
.get('/',(req,res)=>{
     res.json(orders)
})

.get('/:id',(req,res)=>{
    const {id}=req.params
    console.log(id,'id',orders)
    const order = orders[id]
    order.orderId = parseInt(new Date().getTime()/1000)
    res.json(order)
})

.post('/createOrder/:orderId',async(req,res)=>{
  const {orderId}  = req.params;
  const order = orders[orderId]
  try{ 
    const linePayBody = {
    ...order,
    redirectUrls:{
        confirmUrl:`${LINEPAY_RETURN_HOST}${LINEPAY_RETURN_CONFIRM_URL}`,
        cancelUrl:`${LINEPAY_RETURN_HOST}${LINEPAY_RETURN_CANCEL_URL}}`,
    }
  }

  const uri = '/payments/request';
const nonce = parseInt(new Date().getTime()/1000)
const string = `${LINEPAY_CHANNEL_SECRET_KEY}/${LINEPAY_VERSION}${uri}${JSON.stringify(linePayBody)}${nonce}`

const signature =Base64.stringify(HmacSHA256(string,LINEPAY_CHANNEL_SECRET_KEY)) 

const headers={
    "Content-Type":"application/json",
    "X-LINE-ChannelId":LINEPAY_CHANNEL_ID,
"X-LINE-Authorization-Nonce":nonce,
"X-LINE-Authorization":signature
}
//準備送出的資訊
// console.log(linePayBody,signature)

const url = `${LINEPAY_SITE}/${LINEPAY_VERSION}${uri}`
// res.json({url,linePayBody,headers})
const linePayRes = await axios.post(url,linePayBody,{headers})
if(linePayRes?.data?.returnCode === '0000'){
    console.log(linePayRes.data.info.paymentUrl.web)
    console.log('驗證成功')
    const linePayUrl = linePayRes.data.info.paymentUrl.web
 res.json({url,linePayBody,headers,linePayUrl})
}else{
    console.log('驗證失敗')
}
res.end()
}
  catch(err){
    res.end()
  }
 
})

module.exports = router
