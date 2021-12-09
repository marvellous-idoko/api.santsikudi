var express = require("express");
const router = express.Router();
const req = require('request')
const util = require('util');
const request = util.promisify(req);
const axios = require('axios')
const fileUpload = require("express-fileupload");

const { sterling, nibss } = require("innovation-sandbox");
// const { sterling, nibss, union } = require("innovation-sandbox");
const loan = require('./schemas/loan')
const offer = require('./schemas/offers')
const Email = require('smtp-server')
var cookieParser = require('cookie-parser');
var session = require('express-session');
const ATs = require('africastalking');
const AT = ATs({
    apiKey: '1e4af632fde243b21fa1c28ee43fc71f3a84c6f89e6604f6b29d5afb9f328c65',
    username: 'sandbox'
});
var messagebird = require('messagebird')('CVQCapc6TzF4VlNLjhhU8qF12');
router.use(fileUpload({ debug: true }));

const transIDD = require('./schemas/transactionIDs')
// const trId = require('./schemas/transactionIDs')
const ussd = require('./schemas/ussd')
// import schemas here
const userSchema = require('./schemas/user')
const deposit = require('./schemas/deposits');
const deU = require('./schemas/addDEU');
const { findOne, db } = require("./schemas/user");
const e = require("express");
const dbt = require('./schemas/debits');
// const crypto = require("crypto");
const { createHmac } = require('crypto');
router.use(cookieParser());
router.use(session({
    secret: 'keyboard cat',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: true }
}))
router.use(express.json());
router.use(express.urlencoded({ extended: true }));

const sandboxKey = '37de4935bccdfa335f59b3783a0368d0'
const sterlingHeader = {
    subscription_key: 't',
    Appid: '69',
    ipval: '0',
    host: 'https://sandboxapi.fsi.ng'
}
const sTrefId = ['0101', '0103', '0103', '0104'];
const sTrefTyp = ['01', '02', '03', '04'];
const sTtransLoc = ['0101', '0103', '0103', '0104'];
router.post('/sms', (req, res) => {
    apiKey = "1e4af632fde243b21fa1c28ee43fc71f3a84c6f89e6604f6b29d5afb9f328c65"
    username = 'sandbox'
})
router.get('/verifyBVN/:bvn/:id', async (req, res) => {
    console.info(req.params.bvn)
    if(req.params.bvn.length == 11){
        nibss.Bvnr.VerifySingleBVN({
            bvn: req.params.bvn,
            sandbox_key: '37de4935bccdfa335f59b3783a0368d0',
            organisation_code: '11111',
            password: "^o'e6EXK5T ~^j2=",
            ivkey: 'eRpKTBjdOq6T67D0',
            aes_key: '9+CZaWqfyI/fwezX',
            host: 'https://sandboxapi.fsi.ng'
        }).then(async r => {
            console.log(r)
            // res.json(r)
            switch (r) {
                case undefined: {
                    const data = {
                        "ResponseCode": "00",
                        "BVN": "12345678901",
                        "FirstName": "Uchenna",
                        "MiddleName": "Chijioke",
                        "LastName": "Nwanyanwu",
                        "DateOfBirth": "22-Oct-1970",
                        "PhoneNumber": "07033333333",
                        "RegistrationDate": "16-Nov-2014",
                        "EnrollmentBank": "900",
                        "EnrollmentBranch": "Victoria Island",
                        "WatchListed": "NO"
                    }
    
                    const p = await userSchema.findOne({ account_no: req.params.id })
                    p.bvn = data;
                    p.verified = true;
                    p.save()
                   
                    res.json({code:1})
                } default: {
                    var p = await userSchema.findOne({ account_no: req.params.id })
                    p.bvn = r['data'];
                    p.verified = true;
                    var ff = await p.save()
                    // res.json(ff)
                }
            }
        })
        // res.json({code:1})

    }
    else{
    res.json({code:0})

    }
   

}).get('/loanHis/:id', async (req, res) => {
    var k = await loan.find({ acctId: req.params.id })
    res.json(k)
}).get('/loans', async (req, res, next) => {
    var ds = await loan.find({ offered: false || null })
    res.json(ds)
    return;
}).get('/loanDet/:id', async (req, res) => {
    var k = await loan.find({ loanId: req.params.id })
    res.json(k)
}).get('/offerDet/:id', async (req, res) => {
    var k = await offer.find({ loanId: req.params.id })
    res.json(k)
}).get('/accOffer/:idOfRec/:loanId',async(req,res)=>{
    var d = await loan.findOne({ loanId: req.params.loanId })
    d.accepted = true
    await d.save()
    var i = await offer.findOne({loanId: req.params.loanId})
    i.accepted = true
    await i.save()
    res.json({code:1,msg:"congrats offer successfully accepted"})
    // var u  = await user.findOne({id:req.params.idOfRec})
    // u.numOfLoanRec = Math.floor(parseInt(u.numOfLoanRec) + 1) 
    // await u.save()
}).get('/rejOffer/:idOfRec/:loanId',async(req,res)=>{
    var d = await loan.findOne({ loanId: req.params.loanId })
    d.offered = false
    d.VCOffer = null
    await d.save()
    var i = await offer.findOne({loanId: req.params.loanId})
    i.accepted = false
    await i.save()
    
    // var u  = await user.findOne({id:req.params.idOfRec})
    // u.numOfLoanRej = Math.floor(parseInt(u.numOfLoanRej) + 1) 
    // await u.save()
    res.json({code:1,msg:"loan sucessfully rejected"})
}).get('/fundLoan/:loanId',async(req,res)=>{

    var lo = await loan.findOne({loanId:req.params.loanId}) 
    tokenGenerator().then(t=>{
        var opons = {
            'method': 'POST',
            // 'url': 'https://developer.ecobank.com/corporateapi/merchant/Signature',
            // 'url': 'https://fsi.ng/api/eco/corporateapi/merchant/card',
            'url': 'https://developer.ecobank.com/corporateapi/merchant/card',
            'headers': { 
                'Authorization': JSON.parse(t.body).token,
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'Origin': 'developer.ecobank.com',
            },
            body: JSON.stringify({
                "paymentDetails": {
                    "requestId": req.params.loanId,
                    "productCode": "GMT112",
                    "amount": lo.amount,
                    "currency": "NGN",
                    "locale": "en_AU",
                    "orderInfo": '255s353',
                    "returnUrl":"https://api-sansti-kudi.herokuapp.com/fundsTransfer"
                },
                "merchantDetails": {
                    "accessCode": "79742570",
                    "merchantID": "ETZ001",
                    "secureSecret": "sdsffd"
                },
                // "secureHash":"85dc50e24f6f36850f48390be3516c518acdc427c5c5113334c1c3f0ba122cdd37b06a10b82f7ddcbdade8d8ab92165e25ea4566f6f8a7e50f3c9609d8ececa4"
                "secureHash": "7f137705f4caa39dd691e771403430dd23d27aa53cefcb97217927312e77847bca6b8764f487ce5d1f6520fd7227e4d4c470c5d1e7455822c8ee95b10a0e9855"
            })
        };
        request(opons, function (error, response) {
            if (error) throw new Error(error);
            else
            {
                res.json(JSON.parse(response.body))
                // console.log(JSON.parse(response.body));
            }

        });
    })
}).get('/fundsTransfer',async(req,res)=>{
    // https://flipcon.netlify.app/payloan/4619984095?vpc_3DSECI=02&vpc_3DSXID=%2B57yQ3%2B5GkF4eGKADpsi6A9YYaM%3D&vpc_3DSenrolled=Y&vpc_3DSstatus=Y&vpc_AVSResultCode=Unsupported&vpc_AcqAVSRespCode=Unsupported&vpc_AcqCSCRespCode=M&vpc_AcqResponseCode=00&vpc_Amount=120000&vpc_AuthorizeId=288287&vpc_BatchNo=20211210&vpc_CSCResultCode=M&vpc_Card=MC&vpc_Command=pay
    // &vpc_Currency=NGN&vpc_Locale=en_AU&vpc_MerchTxnRef=4619984095
    // &vpc_Merchant=ETZ001&vpc_Message=Approved&
    // vpc_OrderInfo=255s353&vpc_ReceiptNo=134408000743
    // &vpc_SecureHash=DB2E78CAB3A4831BC45A2CF7E460098DDFC7F69878A44ECBAF52A875C12CC3DD&
    // vpc_SecureHashType=SHA256&vpc_TransactionNo=10005905209&vpc_TxnResponseCode=0&vpc_VerSecurityLevel=05&vpc_VerStatus=Y
    // &vpc_VerToken=jHyn%2B7YFi1EUAREAAAAvNUe6Hv8%3D&vpc_VerType=3DS&vpc_Version=1
    
    let id =  req.query.vpc_MerchTxnRef
    let msg = req.query.vpc_Message
    let a = await loan.findOne({loanId:req.query.vpc_MerchTxnRef})
    a.paid = true
    let str = '<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"> <meta http-equiv="X-UA-Compatible" content="IE=edge"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Funds Transfer Success</title></head><body>      <h1 style="color: rgb(7, 201, 7);" title="success">Funds transfer successfull</h1><article>you can close this window now</article></body></html>';
    res.status(200).send(str.trim())
})
var tokenGenerator =  ()=>{
    var h
    var options = {
        'method': 'POST',
        'url': 'https://developer.ecobank.com/corporateapi/user/token',
        'headers': {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Origin': 'developer.ecobank.com'
        },
        body: '{ "userId": "iamaunifieddev103",  "password": "$2a$10$Wmame.Lh1FJDCB4JJIxtx.3SZT0dP2XlQWgj9Q5UAGcDLpB0yRYCC"}'
    };
    return request(options)
 
    // , async function(error, response) {
    //     if (error) throw new Error(error);
    // });
}
router.post('/loan', async (req, res) => {
   
   console.info(req.body)
    var k = new loan({ 
        reason: req.body.a.reason,
        summary: req.body.a.summary,
        intRate: req.body.a.type,
        duration: req.body.a.duration,
        amount: req.body.a.amount,
        dateOfRequest: new Date(),
        aboutBusiness: req.body.b.abtBiz,
        acctId: req.body.b.account_no,
        ind: req.body.b.industry,
        gender:req.body.b.gender,
        size:req.body.b.size,
        loanId: Math.floor(Math.random() * 10000000000),
        views: 0
    })
    p = await k.save()
    res.json(p)
}).post('/jk', async (req, res) => {
    // tokenGenerator().then(t=>{
    //     var opons = {
    //         'method': 'POST',
    //         'url': 'https://developer.ecobank.com/corporateapi/merchant/card',
    //         'headers': { 
    //             'Authorization': t.body.slice(41,t.body.length - 2),
    //             'Content-Type': 'application/json',
    //             'Accept': 'application/json',
    //             'Origin': 'developer.ecobank.com'
    //         },
    //         body: JSON.stringify({
    //             "paymentDetails": {
    //                 "requestId": "4466",
    //                 "productCode": "GMT112",
    //                 "amount": "50035",
    //                 "currency": "NGN",
    //                 "locale": "en_AU",
    //                 "orderInfo": "255s353",
    //                 "returnUrl": "https://unifiedcallbacks.com/corporateclbkservice/callback/qr"
    //             },
    //             "merchantDetails": {
    //                 "accessCode": "79742570",
    //                 "merchantID": "ETZ001",
    //                 "secureSecret": "sdsffd"
    //             },
    //             // "secureHash":"85dc50e24f6f36850f48390be3516c518acdc427c5c5113334c1c3f0ba122cdd37b06a10b82f7ddcbdade8d8ab92165e25ea4566f6f8a7e50f3c9609d8ececa4"
    //             "secureHash": "7f137705f4caa39dd691e771403430dd23d27aa53cefcb97217927312e77847bca6b8764f487ce5d1f6520fd7227e4d4c470c5d1e7455822c8ee95b10a0e9855"
    //         })
    
    //     };
    
    //     request(opons, function (error, response) {
    //         if (error) throw new Error(error);
    //         console.log(response.body);
    //     });
    // })
    // console.info("pp")
    // var options = {
    //     'method': 'GET',
    //     'url': 'https://fsi-core-dev.inits.dev/api/sterling/TransferAPIs/api/Spay/InterbankNameEnquiry?Referenceid=01&RequestType=01&Translocation=01&ToAccount=0037514056&destinationbankcode=000001',
    //     'headers': {
    //         'Sandbox-Key': 'x9ovvrQ503lrktm3mPkBPcjm2bWJJGX81626311488',
    //         'Ocp-Apim-Subscription-Key': 't',
    //         'Ocp-Apim-Trace': 'true',
    //         'Appid': '69',
    //         'Content-Type': 'application/json',
    //         'ipval': '0'
    //     }
    // };
    // var oppptions = {
    //     'method': 'GET',
    //     'url': 'https://fsi-core-dev.inits.dev/api/sterling/billpaymentapi/api/Spay/GetBillerPmtItemsRequest?Referenceid=01&RequestType=01&Translocation=01&Bvn=1937247024021&billerid=01',
    //     'headers': {
    //         'Sandbox-Key': 'x9ovvrQ503lrktm3mPkBPcjm2bWJJGX81626311488',
    //         'Ocp-Apim-Subscription-Key': 't',
    //         'Content-Type': 'application/json'
    //     }
    // };
    // var woptions = {
    //     'method': 'POST',
    //     'url': 'https://developer.ecobank.com/corporateapi/merchant/card',
    //     'headers': {
    //         //   'Authorization': 'Bearer eyJhbGciOiJSUzI1NiJ9.eyJzdWIiOiJpYW1hdW5pZmllZGRldjEwMyIsImV4cCI6MTYyNjc1MDQ4MywiaWF0IjoxNjI2NzQzMjgzLCJpc3MiOiJjb20uZWNvYmFuay5jb3Jwb3JhdGVhcGkiLCJqdGkiOiJlZjEzOTljZS1lOGY2LTExZWItODRlOC02ZDA0ZTRmYjMyNTkifQ.XcTtnURz1vkZ3ICM73bACbS9ryVRPXzVxjT3hc7rhjkB1HxYScE6L3m6QlrXZLA7cnBoEXRDKet3foc78WATILLr8vWKR27pV9avvHiK6rvSWdTWlWDnWUKrF8UTBk1cBN1j2QngHvJ2v9ic60BvbsQ1JjhhQAKsdOyaH1xEURT2gdLRvrvBm5CjovJuHlmcoN95gjgQwqCazdZCls3H_2-vxoLReTzbSzlp8FfSvUNrN23bdnqcdFFcur2XG2niP0lzSnyQW-OPyI6BkqdvjFB1dEvwqM9j0OtnBQsx3rMgP-TWd0B91MsLdipHDPxIcYafOi5Zwgx8F6Tj9L7hTw',
    //         'Content-Type': 'application/json',
    //         'Accept': 'application/json',
    //         'Origin': 'developer.ecobank.com',
    //         'Sandbox-Key': 't'

    //     },
    //     body: JSON.stringify({
    //         "paymentDetails": {
    //             "requestId": "4466",
    //             "productCode": "GMT112",
    //             "amount": "50035",
    //             "currency": "GBP",
    //             "locale": "en_AU",
    //             "orderInfo": "255s353",
    //             "returnUrl": "https://unifiedcallbacks.com/corporateclbkservice/callback/qr"
    //         },
    //         "merchantDetails": {
    //             "accessCode": "79742570",
    //             "merchantID": "ETZ001",
    //             "secureSecret": "sdsffd"
    //         },
    //         "secureHash": "85dc50e24f6f36850f48390be3516c518acdc427c5c5113334c1c3f0ba122cdd37b06a10b82f7ddcbdade8d8ab92165e25ea4566f6f8a7e50f3c9609d8ececa4"
    //     })

    // };
    // var options = {
    //     'method': 'POST',
    //     'url': 'https://fsi-core-dev.inits.dev/api/v1/fcmb/payments/nip/transfers',
    //     'headers': {
    //         'sandbox-key': 'x9ovvrQ503lrktm3mPkBPcjm2bWJJGX81626311488',
    //         'Content-Type': 'application/json',
    //         'Accept': 'application/json',
    //         'x-ibm-client-id': 'f'
    //     },
    //     body: JSON.stringify({
    //         "nameEnquiryRef": "999214190218121217000001177403",
    //         "destinationInstitutionCode": "999063",
    //         "channelCode": "2",
    //         "beneficiaryAccountNumber": "0000000000",
    //         "beneficiaryAccountName": "OBIOHA O. GODDY",
    //         "beneficiaryBankVerificationNumber": "1",
    //         "beneficiaryKYCLevel": "3",
    //         "originatorAccountName": "OKUBOTE IDOWU OLUWAKEMI",
    //         "originatorAccountNumber": "0000000000",
    //         "transactionNarration": "Esb Test",
    //         "paymentReference": "12345",
    //         "amount": "100.1",
    //         "traceId": "12345",
    //         "chargeAmount": "52.59",
    //         "platformType": "ESB"
    //     })

    // };
    // var ions = {
    //     'method': 'POST',
    //     'url': 'https://developer.ecobank.com/corporateapi/user/token',
    //     'headers': {
    //         'Content-Type': 'application/json',
    //         'Accept': 'application/json',
    //         'Origin': 'developer.ecobank.com'
    //     },
    //     body: '{ "userId": "iamaunifieddev103",  "password": "$2a$10$Wmame.Lh1FJDCB4JJIxtx.3SZT0dP2XlQWgj9Q5UAGcDLpB0yRYCC"}'

    // };
    //   eyJhbGciOiJSUzI1NiJ9.eyJzdWIiOiJpYW1hdW5pZmllZGRldjEwMyIsImV4cCI6MTYyOTUxMzAzMywiaWF0IjoxNjI5NTA1ODMzLCJpc3MiOiJjb20uZWNvYmFuay5jb3Jwb3JhdGVhcGkiLCJqdGkiOiJmZWZiMjI3NC0wMjE2LTExZWMtOGU0OS1hYmY5NzJhNTkyYjQifQ.Dq5SvfamdPl3DGkk55SMvjuYe1SHwJrXbwbMwbRLeY-tes-fVRB8XE-HtanzbvUwEL8JzmvbBm3l8SI0-T_fiIeGnYFUQRm9EeZlRbp3brD68prPl6XXWzgV6Sbx4zCryRbejPvTVllZA5AsaBvb5nz6dwcIflM1kFU-XkNLburDMl5XexMmBk8pbOfY3d3P1gv-iH54vcjF1Zg4NWfC9jbqkphKT8plOnOFMTiWKPAXhwMM9XVVDIKQwjmIi9bap3yG_Pi1cKs-7wg8w1Yes67Mhr9_iKUMVKnL1vgmOkE5JB-M2zuWm7ZqcVYrK5mx4QhI0w070mVrq2J3hJuq0g

   

    {
        // var options = {
        //         'url': 'https://developer.ecobank.com/corporateapi/user/token',
        //                 'method': 'POST',
        //         // 'hostname': 'developer.ecobank.com',
        //         // 'path': '/corporateapi/user/token',
        //         'headers': {
        //           'Content-Type': 'application/json',
        //           'Accept': 'application/json',
        //           'Origin': 'developer.ecobank.com'
        //         },
        //         body: '{ "userId": "iamaunifieddev103",  "password": "$2a$10$Wmame.Lh1FJDCB4JJIxtx.3SZT0dP2XlQWgj9Q5UAGcDLpB0yRYCC"}'
        //         }
        //       request(options, function (error, response) {
        //     if (error) throw new Error(error);
        //     console.log(response.body +"body") ;
        //     console.log(response.header+"header");
        // });
    }
    {
        //     {"username":"iamaunifieddev103","token":"eyJhbGciOiJSUzI1NiJ9.eyJzdWIiOiJpYW1hdW
        // 5pZmllZGRldjEwMyIsImV4cCI6MTYyMTIyMDA2MywiaWF0IjoxNjIxMjEyODYzLCJpc3MiOiJjb20uZW
        // NvYmFuay5jb3Jwb3JhdGVhcGkiLCJqdGkiOiI2YmM2YWQ0Zi1iNmFhLTExZWItYjg1Mi05YjNiYTA1MT
        // FjYjQifQ.QTn6aHQiAm3PpgFsCoV9hsfK_IvpJeQy6a27bWoHzTd53RoHahS3H4PkzCo5_en_NS9NU7Q
        // x2XXEhGqxEwiCNmocl1_B4V9vfVNpTC6hm8T3-stYlBLcyOp2geHGdAslH6IT0_2QQStbMLipz4p9YfV
        // oicK5vvX1MGORLK7hoAG_W_kz6ZFmKNsDmp7Ab3haFpW5zTxo2tFVMEl1TF_0nbJmYJOWJDPtrnKnGVJ
        // lLeiSLJb_SM_GjceG2_FNBPPYgqO56YdhzuVbleK5cdQfd2WMSinhKFOuklmIRBUIHr8pvHowhrNT-_5
        // Ej8G6MqMPRo-JoGfOlRt0CdJeZuV4AA"}
        // var options = {
        //     'method': 'POST',
        //     'url': 'https://appsuat.ecobank.com/agencybanking/services/thirdpartyagencybanking/getairtimebillers',
        //     // 'url': 'https://developer.ecobank.com/corporateapi/user/token',
        //     'headers': {
        //         'Content-Type': 'application/json',
        //         'Accept': 'application/json',
        //         'Origin': 'sandboxapi.fsi.ng'
        //     },
        //     "body": JSON.stringify({
        //         "header": {
        //             "affcode": "EGH",
        //             "requestId": "123456",
        //             // "requestToken": "",
        //             "requestToken": "eyJhbGcciOiJSUzI1NiJ9.eyJzdWIiOiJpYW1hdW5pZmllZGRldjEwMyIsImV4cCI6MTYyMTIyMDA2MywiaWF0IjoxNjIxMjEyODYzLCJpc3MiOiJjb20uZWNvYmFuay5jb3Jwb3JhdGVhcGkiLCJqdGkiOiI2YmM2YWQ0Zi1iNmFhLTExZWItYjg1Mi05YjNiYTA1MTFjYjQifQ.QTn6aHQiAm3PpgFsCoV9hsfK_IvpJeQy6a27bWoHzTd53RoHahS3H4PkzCo5_en_NS9NU7Qx2XXEhGqxEwiCNmocl1_B4V9vfVNpTC6hm8T3-stYlBLcyOp2geHGdAslH6IT0_2QQStbMLipz4p9YfVoicK5vvX1MGORLK7hoAG_W_kz6ZFmKNsDmp7Ab3haFpW5zTxo2tFVMEl1TF_0nbJmYJOWJDPtrnKnGVJlLeiSLJb_SM_GjceG2_FNBPPYgqO56YdhzuVbleK5cdQfd2WMSinhKFOuklmIRBUIHr8pvHowhrNT-_5Ej8G6MqMPRo-JoGfOlRt0CdJeZuV4AA",
        //             "sourceCode":  "TEST",
        //             "sourceIp": "129.205.124.156",
        //             "channel": "MOBILE",
        //             "requesttype": "VALIDATE",
        //             "agentcode": "50420442"
        //         }
        //     })
        //     // body:'{"param1":"EGH","param2":"123456","param3":"50420442","param4":"TEST","param5":"129.205.124.156"}',
        //   AffiliateCode + Request ID + Agent Code + Source Code + IP Address
        // body: '{ "userId": "iamaunifieddev103", "password": "$2a$10$Wmame.Lh1FJDCB4JJIxtx.3SZT0dP2XlQWgj9Q5UAGcDLpB0yRYCC" }'
        // body: '{ "": "iamaunifieddev103", "password": "$2a$10$Wmame.Lh1FJDCB4JJIxtx.3SZT0dP2XlQWgj9Q5UAGcDLpB0yRYCC" }'
        // };
        // request(options, function (error, response) {
        //     if (error) throw new Error(error);
        //     console.log(response.body +"body") ;
        //     console.log(response.header+"header");
        // });
    }
//     var request = require('request');
var options = {
  'method': 'GET',
  'url': 'https://fsi.ng/api/sterling/billpaymentapi/api/Spay/GetBillerPmtItemsRequest?Referenceid=01&RequestType=01&Translocation=01&Bvn=1937247024021&billerid=01',
  'headers': {
    'Sandbox-Key': '4NN3rMeZHKPw8j4K32PxQ74nq0hCXIWZ1635258124',
    'Ocp-Apim-Subscription-Key': 't',
    'Content-Type': 'application/json'
  }
};
request(options, function (error, response) {
  if (error) throw new Error(error);
  console.log(response.body);
});

sterling.Account.InterbankTransferReq({
    sandbox_key: sandboxKey,
    payload: {
        Referenceid: sTrefId,
        RequestType: sTrefTyp,
        Translocation: sTtransLoc,
        ToAccount: '1222',
        Destinationbankcode: '01',
        SessionID: '01',
        FromAccount: req.params.acctNo,
        Amount: req.params.amt,
        NEResponse: '01',
        BenefiName: 'Adrian Daniels',
        PaymentReference: '01',
        OriginatorAccountName: 'Paul Gambia',
        translocation: '01'
    },
    sterlingHeader
}).then(resp => {
    res.json(resp)
}).catch(e => {
    console.info(e);
})
}).post('/payloan/:id',async (req,res)=>{
//     ha = await loan.findOne({loanId:req.params.id})
//     var interest = parseFloat(ha.amount) * parseFloat(ha.intRate)
//     var amt = interest + parseFloat(ha.amount)
//     var charge = amt * 0.03
//    var total = amt + charge
    tokenGenerator().then(t=>{
        var opons = {
            'method': 'POST',
            'url': 'https://developer.ecobank.com/corporateapi/merchant/card',
            'headers': { 
                'Authorization': t.body.slice(41,t.body.length - 2),
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'Origin': 'developer.ecobank.com'
            },
            body: JSON.stringify({
                "paymentDetails": {
                    "requestId": '4466',
                    "productCode": "GMT112",
                    "amount": "220300000",
                    "currency": "NGN",
                    "locale": "en_AU",
                    "orderInfo": '255s353',
                    "returnUrl": "https://unifiedcallbacks.com/corporateclbkservice/callback/qr"
                },
                "merchantDetails": {
                    "accessCode": "79742570",
                    "merchantID": "ETZ001",
                    "secureSecret": "sdsffd"
                },
                // "secureHash":"85dc50e24f6f36850f48390be3516c518acdc427c5c5113334c1c3f0ba122cdd37b06a10b82f7ddcbdade8d8ab92165e25ea4566f6f8a7e50f3c9609d8ececa4"
                "secureHash": "7f137705f4caa39dd691e771403430dd23d27aa53cefcb97217927312e77847bca6b8764f487ce5d1f6520fd7227e4d4c470c5d1e7455822c8ee95b10a0e9855"
            })
        };
        request(opons, function (error, response) {
            if (error) throw new Error(error);
            console.log(response.body);
            res.json(response.body.slice(response.body.search('https://')).slice(0,response.body.slice(response.body.search('https://')).search('"')))

        });
    })
    var hy = '{"response_code":200,"response_message":"success","response_content":"https://migs-mtf.mastercard.com.au/vpcpay?vpc_AccessCode=79742570&vpc_Amount=50035&vpc_Version=1&vpc_MerchTxnRef=4466&vpc_OrderInfo=255s353&vpc_Command=pay&vpc_Currency=NGN&vpc_Merchant=ETZ001&vpc_Locale=en_AU&vpc_ReturnURL=https%3A%2F%2Funifiedcallbacks.com%2Fcorporateclbkservice%2Fcallback%2Fqr&vpc_SecureHash=9037D4B97CE9508D16DCC69D1DAE46F3533C996351ED96AC05638CBF323BE243&vpc_SecureHashType=SHA256","response_timestamp":"2021-10-03T01:59:31.722"}'
    // console.info("pp")
}).post('/trgsearch',async(req,res)=>{
        console.info(req.body)
         var d = await loan.find(req.body)
         res.json(d)
}).post('/submitOffer', async (req, res) => {
    var d = await loan.findOne({ loanId: req.body.offer.id })
   console.info(req.body)
    d.VCOffer = {
        intRate: req.body.offer.intRate,
        amount: req.body.offer.amt,
        msg: req.body.offer.msg,
        duration: req.body.offer.duration,
        acctIdOfFinancier: req.body.id
    }   
    d.offered = true
    d.views = Math.ceil(d.views + 1)
    await d.save()
    // console.log(await d.save())

    // Save offer to offer Database
    var f = new offer({
        dateOfoffer: new Date(),
        loanId: req.body.offer.id,
        amt: req.body.offer.amt,
        intRate: req.body.offer.intRate,
        duration: req.body.offer.duration,
        id: req.body.id,
        idofrecepient: req.body.offer.idd,
        offerSummary:req.body.offer.msg
    })
    res.json(await f.save())
}).post('/editProp',async(req,res)=>{
    var d = await loan.findOne({ loanId: req.body.offer.id })
    console.info(req.body)
     d.VCOffer = {
         intRate: req.body.offer.intRate,
         amount: req.body.offer.amt,
         msg: req.body.offer.msg,
         duration: req.body.offer.duration,
         acctIdOfFinancier: req.body.id
     }   
     d.offered = true
     d.views = Math.ceil(d.views + 1)
     await d.save()
     var f = await offer.findOne({loanId:req.body.offer.id})
     f.amt = req.body.offer.amt
     f.duration = req.body.offer.duration
     f.intRate =  req.body.offer.intRate
     f.offerSummary = req.body.offer.msg
    //  loanId: req.body.offer.id,
    //     amt: req.body.offer.amt,
    //     intRate: req.body.offer.intRate,
    //     duration: req.body.offer.duration,
    //     id: req.body.id,
    //     idofrecepient: req.body.offer.idd,
    //     offerSummary:req.body.offer.msg
     f.save()
     res.json({code:1})
})
router.get('/getOffers/:id', async (req, res) => {
    res.json(await offer.find({ id: req.params.id }))
}).get('/opo',(req,res)=>{
    // var request = require('request');
var options = {
  'method': 'GET',
  'url': 'https://fsi.ng/api/sterling/billpaymentapi/api/Spay/GetBillerPmtItemsRequest?Referenceid=01&RequestType=01&Translocation=01&Bvn=1937247024021&billerid=01',
  'headers': {
    'Sandbox-Key': '3f81b44afa59a7737ffd448d458aef99',
    'Ocp-Apim-Subscription-Key': 't',
    'Content-Type': 'application/json',
    'Appid':'69',
    'ipval':'0'
  },
  'params':{
      'Referenceid':'01',
        'RequestType':'01',
        'Translocation':'01',
        'Bvn':'aziUkQyWgW1Zq45dmJMoZNAkFrnSepNL1633588985',
        'billerid':'01'
  }
}
request(options, function (error, response) {
  if (error) throw new Error(error);
  console.log(response.body);
});
}).get('/incrViews/:id',async(req,res)=>{
 var d = await loan.findOne({loanId:req.params.id})
 console.info(parseInt(d.views) + 1)
 d.views = Math.ceil(d.views + 1)
 d.save()  
})
router.get('/nvny/:id', async (req, res) => {
    var s = await offer.findOne({ loanId: req.params.id })
    s.accepted = false;
    s.save()
    var d = await loan.findOne({ loanId: req.params.id })
    d.VCOffer = '';
    d.offered = false
    d.save()
    res.json({ a: 'offer rejected' })
})
// .get('/accOffer/:id', async (req, res) => {
//     var s = await offer.findOne({ loanId: req.params.id })
//     s.accepted = true;
//     s.save()
//     var d = await loan.findOne({ loanId: req.params.id })
//     d.save()
//     res.json({ a: 'offer accepted' })
// })
router.get('/nameEnq/:acctNo', (req, res) => {
    nameEnquiry(req.params.acctNo).then(e => {
        res.json(e['data'])
    })
}).get('/intBankEnq/:acctNo/:amt', (req, res) => {
    // console.info(transferSt(req.params.acctNo,req.params.acctNo,
    // req.params.amt,'Paul Gambia','Adrian Daniels'))

    sterling.Account.InterbankTransferReq({
        sandbox_key: sandboxKey,
        payload: {
            Referenceid: sTrefId,
            RequestType: sTrefTyp,
            Translocation: sTtransLoc,
            ToAccount: req.params.acctNot,
            Destinationbankcode: '01',
            SessionID: '01',
            FromAccount: req.params.acctNo,
            Amount: req.params.amt,
            NEResponse: '01',
            BenefiName: 'Adrian Daniels',
            PaymentReference: '01',
            OriginatorAccountName: 'Paul Gambia',
            translocation: '01'
        },
        sterlingHeader
    }).then(resp => {
        res.json(resp)
    }).catch(e => {
        console.info(e);
    })
})
function ool(recpt, body) {
    var messagebird = require('messagebird')('S2TCrkC1qKWWTHhqg4Utau2J5')

    var params = {
        'originator': 'Santsi Kudi',
        'recipients': [
            '+' + recpt
        ],
        'body': body
    };

    messagebird.messages.create(params, function (err, response) {
        if (err) {
            return console.log(err);
        }
        console.log(response);
    });
}
router.post('/withdrawal', async (req, res) => {
    try {
        const u = await userSchema.findOne({ account_no: req.body.id })
        if (u.acctBalance < parseInt(req.body.amt)) {
            res.json({ code: 00, msg: "insuficient funds. Credit your account to complete this transaction" });
            return;
        }
        u.acctBalance = Math.ceil(parseInt(u.acctBalance) - parseInt(req.body.amt));
        u.save((e, j) => {
            msg = `Dear customer, #${req.body.amt} was withdrawn from your account on ${new Date()}.
            Your new account Balance is ${u.acctBalance}`
            var op = new dbt();
            op.dateOfTransaction = new Date();
            op.amtWitdrawn = req.body.amt;
            op.refNo = Math.floor(Math.random() * 10000000000)
            op.account_no = req.body.id
            op.save((e, p) => {
                if (e) throw e;
                console.log(p)
                oo(u.email, u.fullName, msg)
                res.json({
                    msg: msg
                })
            })
        })
    } catch (e) {
        console.error(e + "\n " + e['msg']);
    }
}).post('/addReg', async (req, res) => {
    console.info(req.body)
    const u = new deU();
    u.fullName = req.body.fullName;
    u.email = req.body.email;
    u.password = req.body.password;
    u.save((e, r) => {
        if (e) res.send('unable to register')
        else {
            console.info(r)
            res.json('successfully registered user')
        }
    })

}).post('/addLogin', async (req, res) => {
    console.info(req.body)
    console.info(req.headers)
    try {
        deU.findOne({ email: req.body.email }, async (e, r) => {
            if (e) console.info(e)
            else {
                if (r['password'] == req.body.password) res.json(r)
            }
        })
        // res.json(d)
    }
    catch (e) {
        res.json('error signing in  . . . ')
    }
})




function oo(email, fullName, msg) {
    console.log('called . . .')
    const mailjet = require('node-mailjet')
        .connect('5ce373d7ff5e5eafb859cca5e36d9cbd', 'b832a63817de1ca41801d1c2edfcd923')
    const request = mailjet
        .post("send", { 'version': 'v3.1' })
        .request({
            "Messages": [
                {
                    "From": {
                        "Email": "santsikudi@gmail.com",
                        "Name": "Santsi Kudi"
                    },
                    "To": [
                        {
                            "Email": email,
                            "Name": fullName
                        }
                    ],
                    "Subject": "Notification from Santsi Kudi",
                    "TextPart": msg,
                    "HTMLPart": `<p>${msg}</>`,
                    "CustomID": "AppGettingStartedTest"
                }
            ]
        })
    request
        .then((result) => {
            console.log(result.body)
        })
        .catch((err) => {
            console.log(err.statusCode)
        })
}

var uPin;
var acctNoToTransferTo; var u; var amtTran; var recsantsID, senderSantsiID
router.post('/ussd', async (req, res) => {
    let { sessionId, serviceCode, phoneNumber, text } = req.body;
    // console.log(req.body)
    // var u;
    userSchema.findOne({ contact: phoneNumber.toString().slice(1, 14) }, (e, r) => {
        if (e) {
            console.error(e)
            return;
        }
        else if (r != null || undefined) u = r
        else if (u == undefined || null) {
            let response = `END Your phone no. does not exist on Santsi Kudi, 
        make sure you use the number submitted while registering on the app`
            res.send(response)
            return;
        }

    });

    var s = text.toString()

    if (s == '') {
        let response;
        const uuser = new ussd()
        console.info(await ussd.findOne({ contact: phoneNumber.toString().slice(1, 14) }))
        ussd.findOne({ contact: phoneNumber.toString().slice(1, 14) }, (e, r) => {
            console.info(phoneNumber.toString().length)
            console.info(phoneNumber.toString().slice(1, 14))
            if (e) {
                console.error('deed' + e)
            } else if (r == null) {
                console.info(r)
                uuser.contact = phoneNumber.toString().slice(1, 14)
                uuser.save((e, r) => {
                    if (e) console.info(e)
                    console.info(r)
                    res.send(response);
                })
            } else {
                response = `CON Welcome to Santsu Kudi
                    Choose Language
                    1. English
                    2. Hausa`
                res.send(response)
            }
        })
    }
    else if (s == '1') {
        let response = `CON Thanks for choosing English
            What would you like to do on Santsi Kudi
            1. Payment
            2. Account Balance Enquiry
            3. Save
            4. loan
            5. create pin
            6. Withdrawal

            
            ...Santsi Kudi`
        res.send(response);
    }

    else if (s == '1*1') {
        let response = `CON choose where to pay to
                    1. A Financial Institution(Bank) Account
                    2. A Santsi Account
                    
                    ...Santsi Kudi`
        res.send(response);
    }
    else if (s == '1*1*2') {
        let response = `Input the Santsi Kudi Account to credit`
        res.send(response)
    }








    else if (s == '1*1*2*' + s.slice(6, 16)) {
        let response;
        var uyt = await userSchema({ account_no: slice(6, 16) })
        if (uyt == null || undefined) {
            response = `END Account no found check your 
                            Check the account number and try again later`
            res.send(response)
        }
        response = `CON Details of the account to transfer to
                        Name: ${uyt['fullName']}
                        Account Number: ${uyt['account_no']}
                        select 1 to proceed`
        res.send(res)
    }
    else if (s == '1*1*2*' + s.slice(6, 16) + '*1') {

        let t = new deposit({
            dateOfTransaction: new Date(),
            nameOfDepostor: u.fullName,
            account_noOfDepositor: u.account_no,
            amountDeposited: req.params.amount,
            account_noOfReceipient: req.params.aor,
            nameOfReceipient: req.params.nor,
            refNo: Math.floor(Math.random() * 10000000000)
        })
        try {
            t.save(async (e, uu) => {
                if (e) throw 0;
                const p = await userSchema.findOne({ account_no: req.params.aor })
                p.acctBalance = Math.ceil(parseInt(p.acctBalance) + parseInt(req.params.amount))
                console.info(p.acctBalance)
                var ppp = await p.save();
                res.json(ppp)
            })

        } catch (e) {
            console.info(e)
        }
    }
    else if (s == '1*1*1') {
        console.info(text.toString().length)
        let response = `CON input the Bank account account no to pay to`
        res.send(response);
    }
    else if (s == '1*1*1*' + s.slice(6, 16)) {
        console.info(text.toString().length)
        let response;
        var ne = await nameEnquiry(text.slice(6, 16))
        acctNoToTransferTo = ne.data.data.AccountNumber;
        if (ne.data.data.AccountNumber != text.slice(6, 16)) {
            response = `CON This is a sandbox environment therefore
                                we used the account number assigned to the in Sterling Sandbox   
                                Account details return from the 
                                sandbox name enquiry  
                                message: ${ne.data.message}
                                reponse: ${ne.data.response}
                                account number : ${ne.data.data.AccountNumber}
                                account status : ${ne.data.data.status}
                                select 1 to proceed`
            res.send(response)
        }

        else if (ne.message == 'OK') {
            response = `CON Account details retun from the 
                                sandbox name enquiry  
                                message: ${ne.data.message}
                                reponse: ${ne.data.response}
                                account number : ${ne.data.data.AccountNumber}
                                account status : ${ne.data.data.status}
                                select 1 to proceed`
            res.send(response)
        } else {
            response = `END Wrong Account Number`
            res.send(response)
        }

    }
    else if (s == '1*1*1*' + s.slice(6, 16) + '*1') {
        let response = `CON select amount to transfer
                            1. 1,000.00
                            2. 2,000.00
                            3. 5,000.00
                            4. 7,000.00
                            5. 10,000.00
                            6. 15,000.00
                            7. 20,000.00
                            8. 50,000.00
                            9. 100,000.00
                            10. 200,000.00`
        res.send(response)
    }
    else if (s == '1*1*1*' + s.slice(6, 16) + '*1*1') {
        amtTran = 100000
        let response = `CON Transfering #1,000.00 to
                             ${acctNoToTransferTo}
                            input your pin to complete payment`
        res.send(response)
    }
    else if (s == '1*1*1*' + s.slice(6, 16) + '*1*2') {

        amtTran = 200000
        let response = `CON Transfering #2,000.00 to ${acctNoToTransferToe}
                            input your pin to complete payment`
        res.send(response)
    } else if (s == '1*1*1*' + s.slice(6, 16) + '*1*3') {
        amtTran = 500000
        let response = `CON Transfering #5,000.00 to ${acctNoToTransferTo}
                            input your pin to complete payment`
        res.send(response)
    } else if (s == '1*1*1*' + s.slice(6, 16) + '*1*4') {
        amtTran = 700000
        let response = `CON Transfering #7,000.00 to ${acctNoToTransferTo}
                            input your pin to complete payment`
        res.send(response)
    } else if (s == '1*1*1*' + s.slice(6, 16) + '*1*5') {
        amtTran = 1000000
        let response = `CON Transfering #10,000.00 to ${acctNoToTransferToe}
                            input your pin to complete payment`
        res.send(response)
    } else if (s == '1*1*1*' + s.slice(6, 16) + '*1*6') {
        amtTran = 15000000
        let response = `CON Transfering #15,000.00 to ${acctNoToTransferTo}
                            input your pin to complete payment`
        res.send(response)
    } else if (s == '1*1*1*' + s.slice(6, 16) + '*1*7') {
        amtTran = 2000000
        let response = `CON Transfering #20,000.00 to ${acctNoToTransferTo}
                            input your pin to complete payment`
        res.send(response)
    } else if (s == '1*1*1*' + s.slice(6, 16) + '*1*8') {
        amtTran = 5000000
        let response = `CON Transfering #50,000.00 to ${acctNoToTransferTo}
                            input your pin to complete payment`
        res.send(response)
    } else if (s == '1*1*1*' + s.slice(6, 16) + '*1*9') {
        amtTran = 10000000
        let response = `CON Transfering #100,000.00 to ${acctNoToTransferTo}
                            input your pin to complete payment`
        res.send(response)
    } else if (s == '1*1*1*' + s.slice(6, 16) + '*1*10') {
        amtTran = 20000000
        let response = `CON Transfering #200,000.00 to ${acctNoToTransferTo}
                            input your pin to complete payment`
        res.send(response)
    }
    // else if(s=='1*1*1*'+s.slice(6,16) + '*1*10*1234'){
    //     let response = `END 
    //     lenght of S is ${s.length}
    //      pin starts at ${s.slice(23)}
    //      pin starts at ${s.slice(22)}

    //     `
    //     res.send(response)
    // }
    else if (s == '1*1*1*' + s.slice(6, 16) + '*1*10*' + s.slice(22, 26)) {
        console.log(s.slice(22, 26) + '===[in')
        let response;
        var u = await ussd.findOne({ contact: phoneNumber.slice(1) })
        if (s.slice(22, 26).trim() == u.pin) {
            let response
            if (u.acctBalance < amtTran) {
                response = `END Insufficient funds
                                                credit your accout to complete this transaction`
                res.send(response)
            }
            console.info(acctNoToTransferTo + ": account numbe rot trasnfer to")
            console.info(amtTran + ": amount to trasnfer")
            sterling.Account.InterbankTransferReq({
                sandbox_key: sandboxKey,
                payload: {
                    Referenceid: sTrefId,
                    RequestType: sTrefTyp,
                    Translocation: sTtransLoc,
                    ToAccount: acctNoToTransferTo,
                    Destinationbankcode: '01',
                    SessionID: '01',
                    FromAccount: acctNoToTransferTo,
                    Amount: amtTran,
                    NEResponse: '01',
                    BenefiName: 'Adrian Daniels',
                    PaymentReference: '01',
                    OriginatorAccountName: 'Paul Gambia',
                    translocation: '01'
                },
                sterlingHeader
            }).then(resp => {
                console.info(resp)
                response = `END Transfer successful 
                                            and ${parseInt(amtTran) / 100} was deducted from your account
                                            message: ${resp.message}
                                            response text: ${resp.data.ResponseText}
                                            status: ${resp.data.status}
                                                    `
                res.send(response)
            }).catch(e => {
                console.info(e);
            })
        }
        else if (u.pin == null || undefined) {
            response = `END go to main menu and create a pin. To perform transactions on Santsi kudi`
            res.send(response)
            return;
        }
        else if (s.slice(22, 26).trim() != u.pin) {
            response = `END wrong pin, check the pin and try again later`
            res.send(response)
            return;
        }
        //     ussd.findOne({contact:phoneNumber},async(e,o)=>{

        //     if(e){
        //         console.info(e)
        //         response = `END User Not found`
        //         res.send(response)
        //         return;
        //     }
        //     else if (o.pin == null || undefined) {
        //         response = `END go to main menu and create a pin. To perform transactions on Santsi kudi`
        //         res.send(response)
        //         return;
        //     }
        //     else if (o.pin != text.slice(22,26)){
        //         response = `END wrong pin, check your pin and try again later`
        //         res.send(response)
        //         return;
        //     }
        //     else if (o.pin == text.slice(22,26)){
        //         let response 
        //         if (u.acctBalance < amtTran){
        //                 response = `END Insufficient funds
        //                 credit your accout to complete this transaction`
        //                 res.send(response)    
        //          }
        //             sterling.Account.InterbankTransferReq({
        //                 sandbox_key: sandboxKey,
        //                 payload: {
        //                     Referenceid: sTrefId,
        //                     RequestType: sTrefTyp,
        //                     Translocation: sTtransLoc,
        //                     ToAccount:acctNoToTransferTo,
        //                     Destinationbankcode: '01',
        //                     SessionID: '01',
        //                     FromAccount:acctNoToTransferTo,
        //                     Amount:  amtTran,
        //                     NEResponse: '01',
        //                     BenefiName: 'Adrian Daniels',
        //                     PaymentReference: '01',
        //                     OriginatorAccountName:'Paul Gambia',
        //                     translocation: '01'
        //                 },
        //                 sterlingHeader
        //             }).then(resp => {
        //             response =  `END Transfer successful 
        //             and ${amtTran} was deducted from your account
        //             message: ${resp.message}
        //             response: ${resp.data.response}
        //             response text: ${resp.data.data.ResponseText}
        //             status: ${resp.data.data.status}
        //                     `
        //                 res.send(response)
        //             }).catch(e => {
        //                 console.info(e);
        //                 })
        //     }
        // })
    }
    else if (s == '1*2') {

        let response = `END Here is you account balance ${u.acctBalance}
            Have a nice day`
        res.send(response)
    }
    else if (s == '1*5') {
        let response
        try {
            ussd.findOne({ contact: phoneNumber.toString().slice(1, 14) }, (e, u) => {
                if (e) throw "not found";
                if (u.pin == null || undefined) {
                    response = `CON set a four digits pin e.g 1234`
                    res.send(response)
                } else {
                    response = `CON pin already set
                    press 1 to set new pin`
                    res.send(response)
                }
            })
            // u.
        }
        catch (err) { console.error(err) }
    }
    else if (s == '1*5*1') {
        let response = `CON input old pin`
        res.send(response)

    }


    else if (s == '1*5*1*' + s.slice(6, 10)) {
        console.log(s.slice(6, 10))
        let response
        var b = await ussd.findOne({ contact: phoneNumber.toString().slice(1, 14) })
        console.info(b)
        if (b.pin != s.slice(6, 10)) {
            console.log(s.slice(6, 10))
            console.log(s.slice(6, 9))
            response = `END wrong pin, try again later`
            res.send(response)
        } else {
            response = `CON Input new pin e.g 1234`
            res.send(response)
        }
    }
    else if (s == '1*5*1*' + s.slice(6, 10) + '*' + s.slice(12)) {

        var b = await ussd.findOne({ contact: phoneNumber.toString().slice(1, 14) })
        b.pin = s.slice(12);
        var finished = await b.save()
        let response = `END Your pin has successfully be set ${finished.pin}`
        res.send(response)

    }
    else if (s == '1*5*' + s.slice(4, 8)) {
        var b = await ussd.findOne({ contact: phoneNumber.toString().slice(1, 14) })
        console.info(b)
        let response
        console.info(s)
        console.info(s.slice(4, 8))
        b.pin = s.slice(4, 8);
        var finished = await b.save((e, r) => {
            if (e) console.error(e)
            response = `END Your pin has successfully be set ${r.pin}`
            res.send(response)
        })
        //  = `END Your pin has successfully be set ${finished.pin}`
    }

    else if (s == '1*3') {
        let response = `CON select amount to save
            1. 1,000.00
            2. 2,000.00
            3. 5,000.00
            4. 7,000.00
            5. 10,000.00
            6. 15,000.00
            7. 20,000.00
            8. 50,000.00
            9. 100,000.00
            10. 200,000.00`
        res.send(response)
    }
    else if (s == '1*3*1') {

        amtTran = 100000
        let response = `CON Save #1,000.00 to
             your account no ${u.account_no}
            input your pin to complete payment`
        res.send(response)
    }
    else if (s == '1*3*2') {

        amtTran = 200000
        let response = `CON Save #2,000.00 to ${u.account_no}
            input your pin to complete payment`
        res.send(response)
    } else if (s == '1*3*3') {
        amtTran = 500000
        let response = `CON Save #5,000.00 to ${u.account_no}
            select mode of payment
            1. Agent
            2. Airtime
            3. Account`
        res.send(response)
    } else if (s == '1*3*4') {
        amtTran = 700000
        let response = `CON Save #7,000.00 to ${u.account_no}
            select mode of payment
            1. Agent
            2. Airtime
            3. Account`
        res.send(response)
    } else if (s == '1*3*5') {
        amtTran = 1000000
        let response = `CON Save #10,000.00 to ${u.account_no}
            select mode of payment
            1. Agent
            2. Airtime
            3. Account`
        res.send(response)
    } else if (s == '1*3*6') {
        amtTran = 15000000
        let response = `CON Save #15,000.00 to ${u.account_no}
            select mode of payment
            1. Agent
            2. Airtime
            3. Account`
        res.send(response)
    } else if (s == '1*3*7') {
        amtTran = 2000000
        let response = `CON Save #20,000.00 to ${u.account_no}
            select mode of payment
            1. Agent
            2. Airtime
            3. Account`
        res.send(response)
    } else if (s == '1*3*8') {
        amtTran = 5000000
        let response = `CON Save #50,000.00 to ${u.account_no}
            select mode of payment
            1. Agent
            2. Airtime
            3. Account`
        res.send(response)
    } else if (s == '1*3*9') {
        amtTran = 10000000
        let response = `CON Save #100,000.00 to ${u.account_no}
            select mode of payment
            1. Agent
            2. Airtime
            3. Account`
        res.send(response)
    } else if (s == '1*3*10') {
        amtTran = 20000000
        let response = `CON Save #200,000.00 to ${u.account_no}
            select mode of payment
            1. Agent (generate voucher)
            2. Airtime
            3. Account`
        res.send(response)
    }

    else if (s == '1*3*1*1') {


        console.info(s)
        var id
        let t = new trId({
            transType: 'credit',
            transDtInit: new Date(),
            transAcctInit: u.account_no,
            amt: amtTran,
            tranExed: false,
            transcID: Math.floor(Math.random() * 10000000000)
        })
        t.save((e, r) => {
            if (e) console.info(e)
            id = r['transcID'];
            let response = `END Go to our nearest agent and finalise your savings
                    this id the ${r['transID']}
                    Have a nice day`
        });

    }
    else if (s == '1*3*2*1') {


        console.info(s)
        var id
        let t = new trId({
            transType: 'credit',
            transDtInit: new Date(),
            transAcctInit: u.account_no,
            amt: amtTran,
            tranExed: false,
            transcID: Math.floor(Math.random() * 10000000000)
        })
        t.save((e, r) => {
            if (e) console.info(e)
            id = r['transcID'];
            let response = `END Go to our nearest agent and finalise your savings
                    this id the ${r['transID']}
                    Have a nice day`
        });

    }
    else if (s == '1*3*3*1') {

        console.info(s)
        var id
        let t = new trId({
            transType: 'credit',
            transDtInit: new Date(),
            transAcctInit: u.account_no,
            amt: amtTran,
            tranExed: false,
            transcID: Math.floor(Math.random() * 10000000000)
        })
        t.save((e, r) => {
            if (e) console.info(e)
            id = r['transcID'];
            let response = `END Go to our nearest agent and finalise your savings
                this id the ${r['transID']}
                Have a nice day`
        });
    }


    else if (s == '1*3*4*1') {

        console.info(s)
        var id
        let t = new trId({
            transType: 'credit',
            transDtInit: new Date(),
            transAcctInit: u.account_no,
            amt: amtTran,
            tranExed: false,
            transcID: Math.floor(Math.random() * 10000000000)
        })
        t.save((e, r) => {
            if (e) console.info(e)
            id = r['transcID'];
            let response = `END Go to our nearest agent and finalise your savings
                this id the ${r['transID']}
                Have a nice day`
        });
    }


    else if (s == '1*3*5*1') {

        console.info(s)
        var id
        let t = new trId({
            transType: 'credit',
            transDtInit: new Date(),
            transAcctInit: u.account_no,
            amt: amtTran,
            tranExed: false,
            transcID: Math.floor(Math.random() * 10000000000)
        })
        t.save((e, r) => {
            if (e) console.info(e)
            id = r['transcID'];
            let response = `END Go to our nearest agent and finalise your savings
                this id the ${r['transID']}
                Have a nice day`
        });
    }


    else if (s == 'f1*3*6*1') {

        console.info(s)
        var id
        let t = new trId({
            transType: 'credit',
            transDtInit: new Date(),
            transAcctInit: u.account_no,
            amt: amtTran,
            tranExed: false,
            transcID: Math.floor(Math.random() * 10000000000)
        })
        t.save((e, r) => {
            if (e) console.info(e)
            id = r['transcID'];
            let response = `END Go to our nearest agent and finalise your savings
                this id the ${r['transID']}
                Have a nice day`
        });
    }


    else if (s == '1*3*7*1') {

        console.info(s)
        var id
        let t = new trId({
            transType: 'credit',
            transDtInit: new Date(),
            transAcctInit: u.account_no,
            amt: amtTran,
            tranExed: false,
            transcID: Math.floor(Math.random() * 10000000000)
        })
        t.save((e, r) => {
            if (e) console.info(e)
            id = r['transcID'];
            let response = `END Go to our nearest agent and finalise your savings
                this id the ${r['transID']}
                Have a nice day`
        });
    }


    else if (s == '1*3*8*1') {

        console.info(s)
        var id
        let t = new trId({
            transType: 'credit',
            transDtInit: new Date(),
            transAcctInit: u.account_no,
            amt: amtTran,
            tranExed: false,
            transcID: Math.floor(Math.random() * 10000000000)
        })
        t.save((e, r) => {
            if (e) console.info(e)
            id = r['transcID'];
            let response = `END Go to our nearest agent and finalise your savings
                this id the ${r['transID']}
                Have a nice day`
        });
    }


    else if (s == '1*3*9*1') {

        console.info(s)
        var id
        let t = new trId({
            transType: 'credit',
            transDtInit: new Date(),
            transAcctInit: u.account_no,
            amt: amtTran,
            tranExed: false,
            transcID: Math.floor(Math.random() * 10000000000)
        })
        t.save((e, r) => {
            if (e) console.info(e)
            id = r['transcID'];
            let response = `END Go to our nearest agent and finalise your savings
                this id the ${r['transID']}
                Have a nice day`
        });
    }


    else if (s == '1*3*10*1') {

        console.info(s)
        var id
        let t = new trId({
            transType: 'credit',
            transDtInit: new Date(),
            transAcctInit: u.account_no,
            amt: amtTran,
            tranExed: false,
            transcID: Math.floor(Math.random() * 10000000000)
        })
        t.save((e, r) => {
            if (e) console.info(e)
            id = r['transcID'];
            let response = `END Go to our nearest agent and finalise your savings
                this id the ${r['transID']}
                Have a nice day`
        });
    }


    else if (s == '3') {
        let response = `End Working  . . . .`
        res.send(response)
    }
    else if (s == '2') {
        let response = `CON Godiya ga zabar Turanci
    Me kuke so kuyi Santsi Kudi
       1. biya
       2. Asusun lissafi
       3. ajiye
       4. lamuni
       5. ƙirƙirar fil
       6. Janyewa
 
       ...Santsi Kudi`
        res.send(response);
    }
    else if (s == '2*1') {
        let response = `CON choose where to pay to 
                 1. Assusun Banki
                2. Assusun Santsi
                    
                    ...Santsi Kudi`
        res.send(response);
    }
    else if (s == '2*1*1') {
        console.info(text.toString().length)
        let response = `CON shigar da asusun ajiyar Banki ba biya`
        res.send(response);
    }
    else if (s == '2*1*1*' + s.slice(6, 16)) {
        console.info(text.toString().length)
        let response;
        var ne = await nameEnquiry(text.slice(5, 16))
        acctNoToTransferTo = ne.data.data.AccountNumber;
        if (ne.data.data.AccountNumber != text.slice(5, 16)) {
            response = `END Kun shigar da lambar Asusun da ba daidai ba
                                N: B: Lambar asusun ne kawai aka samo akan Sterling Sandbox
                                za'a iya amfani dashi don wannan ma'amala. Wanne ne 0037514056`
            res.send(response)
        }
        else if (ne.message == 'OK') {
            response = `CON Bayanan asusun sun sake dawowa daga
                                binciken sunan sandbox 
                                sako: ${ne.data.message}
                                amsa: ${ne.data.response}
                                Assunsun Lamba : ${ne.data.data.AccountNumber}
                                Matsayin asusu : ${ne.data.data.status}
                                zaɓi 1 don ci gaba`
            res.send(response)
        } else {
            response = `END Lambar Asusun Ba daidai ba `
            res.send(response)
        }
    }
    else if (s == '1*1*1*' + s.slice(6, 16) + '*1') {
        let response = `CON zaɓi adadin don canja wurin
                           1. 1,000.00
                            2. 2,000.00
                            3. 5,000.00
                            4. 7,000.00
                            5. 10,000.00
                            6. 15,000.00
                            7. 20,000.00
                            8. 50,000.00
                            9. 100,000.00
                            10. 200,000.00`
        res.send(response)
    }
    else if (s == '1*1*1*' + s.slice(6, 16) + '*1*1') {
        amtTran = 100000
        let response = `CON Canzawa #1,000.00 to
                             ${acctNoToTransferTo}
                             shigar da pin dinka dan kammala biyan kudi`
        res.send(response)
    }
    else if (s == '1*1*1*' + s.slice(6, 16) + '*1*2') {

        amtTran = 200000
        let response = `CON Canzawa #2,000.00 to ${nacctNoToTransferToe}
                            shigar da pin dinka dan kammala biyan kudi`
        res.send(response)
    } else if (s == '1*1*1*' + s.slice(6, 16) + '*1*3') {
        amtTran = 500000
        let response = `CON Canzawa #5,000.00 to ${acctNoToTransferTo}
                            shigar da pin dinka dan kammala biyan kudi`
        res.send(response)
    } else if (s == '1*1*1*' + s.slice(6, 16) + '*1*4') {
        amtTran = 700000
        let response = `CON Canzawa #7,000.00 to ${acctNoToTransferTo}
                            shigar da pin dinka dan kammala biyan kudi`
        res.send(response)
    } else if (s == '1*1*1*' + s.slice(6, 16) + '*1*5') {
        amtTran = 1000000
        let response = `CON Canzawa #10,000.00 to ${nacctNoToTransferToe}
                            shigar da pin dinka dan kammala biyan kudi`
        res.send(response)
    } else if (s == '1*1*1*' + s.slice(6, 16) + '*1*6') {
        amtTran = 15000000
        let response = `CON Canzaawa #15,000.00 to ${acctNoToTransferTo}
                            shigar da pin dinka dan kammala biyan kudi`
        res.send(response)
    } else if (s == '1*1*1*' + s.slice(6, 16) + '*1*7') {
        amtTran = 2000000
        let response = `CON Canzawa #20,000.00 to ${acctNoToTransferTo}
                            shigar da pin dinka dan kammala biyan kudi`
        res.send(response)
    } else if (s == '1*1*1*' + s.slice(6, 16) + '*1*8') {
        amtTran = 5000000
        let response = `CON Canzawa #50,000.00 to ${acctNoToTransferTo}
                            shigar da pin dinka dan kammala biyan kudi`
        res.send(response)
    } else if (s == '1*1*1*' + s.slice(6, 16) + '*1*9') {
        amtTran = 10000000
        let response = `CON Canzawa #100,000.00 to ${acctNoToTransferTo}
                            shigar da pin dinka dan kammala biyan kudi`
        res.send(response)
    } else if (s == '1*1*1*' + s.slice(6, 16) + '*1*10') {
        amtTran = 20000000
        let response = `CON Canzawa #200,000.00 to ${acctNoToTransferTo}
                            shigar da pin dinka dan kammala biyan kudi`
        res.send(response)
    }
    else if (s == '1*1*1*' + s.slice(6, 16) + '*1*10' + s.slice(22, 26)) {
        let response;
        console, info(s.slice(22, 26) + ' pin')
        o = ussd.findOne({ contact: phoneNumber })
        if (o.pin == null || undefined) {
            response = `END je zuwa menu na ainihi kuma ƙirƙiri fil. Don yin ma'amala akan
                                Santsi kudi`
            res.send(response)
            return;
        }
        else if (o.pin != text.slice(22, 26)) {
            response = `END Kuskuren kuskure, bincika fil ɗin ka sake gwadawa daga baya`
            res.send(response)
            return;
        }
        else if (o.pin == text.slice(22, 26)) {

            sterling.Account.InterbankTransferReq({
                sandbox_key: sandboxKey,
                payload: {
                    Referenceid: sTrefId,
                    RequestType: sTrefTyp,
                    Translocation: sTtransLoc,
                    ToAccount: acctNoToTransferTo,
                    Destinationbankcode: '01',
                    SessionID: '01',
                    FromAccount: acctNoToTransferTo,
                    Amount: amtTran,
                    NEResponse: '01',
                    BenefiName: 'Adrian Daniels',
                    PaymentReference: '01',
                    OriginatorAccountName: 'Paul Gambia',
                    translocation: '01'
                },
                sterlingHeader
            }).then(resp => {
                let response = `END Transfer successful
                                   message: ${resp.message}
                                   response: ${resp.data.response}
                                   response text: ${resp.data.data.ResponseText}
                                   status: ${resp.data.data.status}
                                        `
                res.send(resp)
            }).catch(e => {
                console.info(e);
            })

        }
    }
    else if (s == '2*2') {

        let response = `END Ga lissafin ku ${u.acctBalance}
            `
        res.send(response)
    }
    else if (s == '2*5') {
        let response
        try {
            ussd.findOne({ contact: phoneNumber.toString().slice(1, 14) }, (e, u) => {
                if (e) throw "not found";
                if (u.pin == null || undefined) {
                    response = `CON saita misali pin pin lambobi hudu 1234`
                    res.send(response)
                } else {
                    response = `CON fil an riga an saita
                    latsa 1 don saita sabon fil`
                    res.send(response)
                }
            })
            // u.
        }
        catch (err) { console.error(err) }
    }
    else if (s == '1*5*1') {
        let response = `CON shigar da tsohon fil`
        res.send(response)

    }


    else if (s == '2*5*1*' + s.slice(6, 10)) {
        console.log(s.slice(6, 10))
        let response
        var b = await ussd.findOne({ contact: phoneNumber.toString().slice(1, 14) })
        console.info(b)
        if (b.pin != s.slice(6, 10)) {
            console.log(s.slice(6, 10))
            console.log(s.slice(6, 9))
            response = `END Kuskuren kuskure, sake gwadawa daga baya`
            res.send(response)
        } else {
            response = `CON saita misali pin pin lambobi hudu e.g 1234`
            res.send(response)
        }
    }
    else if (s == '2*5*1*' + s.slice(6, 10) + '*' + s.slice(12)) {

        var b = await ussd.findOne({ contact: phoneNumber.toString().slice(1, 14) })
        b.pin = s.slice(12);
        var finished = await b.save()
        let response = `END An shirya nasarar fil ɗinka ${finished.pin}`
        res.send(response)

    }
    else if (s == '2*5*' + s.slice(4, 8)) {
        var b = await ussd.findOne({ contact: phoneNumber.toString().slice(1, 14) })
        console.info(b)
        let response
        console.info(s)
        console.info(s.slice(4, 8))
        b.pin = s.slice(4, 8);
        var finished = await b.save((e, r) => {
            if (e) console.error(e)
            response = `END Your pin has successfully be set ${r.pin}`
            res.send(response)
        })
        //  = `END Your pin has successfully be set ${finished.pin}`
    }

    else if (s == '2*3') {
        let response = `CON select amount to save
            1. 1,000.00
            2. 2,000.00
            3. 5,000.00
            4. 7,000.00
            5. 10,000.00
            6. 15,000.00
            7. 20,000.00
            8. 50,000.00
            9. 100,000.00
            10. 200,000.00`
        res.send(response)
    }
    else if (s == '2*3*1') {

        amtTran = 100000
        let response = `CON Save #1,000.00 to
             your account no ${u.account_no}
            input your pin to complete payment`
        res.send(response)
    }
    else if (s == '2*3*2') {

        amtTran = 200000
        let response = `CON Save #2,000.00 to ${u.account_no}
            input your pin to complete payment`
        res.send(response)
    } else if (s == '2*3*3') {
        amtTran = 500000
        let response = `CON Save #5,000.00 to ${u.account_no}
            select mode of payment
            1. Agent
            2. Airtime
            3. Account`
        res.send(response)
    } else if (s == '2*3*4') {
        amtTran = 700000
        let response = `CON Save #7,000.00 to ${u.account_no}
            select mode of payment
            1. Agent
            2. Airtime
            3. Account`
        res.send(response)
    } else if (s == '2*3*5') {
        amtTran = 1000000
        let response = `CON Save #10,000.00 to ${u.account_no}
            select mode of payment
            1. Agent
            2. Airtime
            3. Account`
        res.send(response)
    } else if (s == '2*3*6') {
        amtTran = 15000000
        let response = `CON Save #15,000.00 to ${u.account_no}
            select mode of payment
            1. Agent
            2. Airtime
            3. Account`
        res.send(response)
    } else if (s == '2*3*7') {
        amtTran = 2000000
        let response = `CON Save #20,000.00 to ${u.account_no}
            select mode of payment
            1. Agent
            2. Airtime
            3. Account`
        res.send(response)
    } else if (s == '2*3*8') {
        amtTran = 5000000
        let response = `CON Save #50,000.00 to ${u.account_no}
            select mode of payment
            1. Agent
            2. Airtime
            3. Account`
        res.send(response)
    } else if (s == '2*3*9') {
        amtTran = 10000000
        let response = `CON Save #100,000.00 to ${u.account_no}
            select mode of payment
            1. Agent
            2. Airtime
            3. Account`
        res.send(response)
    } else if (s == '2*3*10') {
        amtTran = 20000000
        let response = `CON Save #200,000.00 to ${u.account_no}
            select mode of payment
            1. Agent (generate voucher)
            2. Airtime
            3. Account`
        res.send(response)
    }
    else if (s == '2*3*1*1') {
        console.info(s)
        var id
        let t = new trId({
            transType: 'credit',
            transDtInit: new Date(),
            transAcctInit: u.account_no,
            amt: amtTran,
            tranExed: false,
            transcID: Math.floor(Math.random() * 10000000000)
        })
        t.save((e, r) => {
            if (e) console.info(e)
            id = r['transcID'];
            let response = `END Go to our nearest agent and finalise your savings
                this id the ${r['transID']}
                Have a nice day`
        });
    }
    else if (s == '2*3*2*1') {
        console.info(s)
        var id
        let t = new trId({
            transType: 'credit',
            transDtInit: new Date(),
            transAcctInit: u.account_no,
            amt: amtTran,
            tranExed: false,
            transcID: Math.floor(Math.random() * 10000000000)
        })
        t.save((e, r) => {
            if (e) console.info(e)
            id = r['transcID'];
            let response = `END Go to our nearest agent and finalise your savings
                this id the ${r['transID']}
                Have a nice day`
        });
    }
    else if (s == '2*3*3*1') {
        console.info(s)
        var id
        let t = new trId({
            transType: 'credit',
            transDtInit: new Date(),
            transAcctInit: u.account_no,
            amt: amtTran,
            tranExed: false,
            transcID: Math.floor(Math.random() * 10000000000)
        })
        t.save((e, r) => {
            if (e) console.info(e)
            id = r['transcID'];
            let response = `END Go to our nearest agent and finalise your savings
                this id the ${r['transID']}
                Have a nice day`
        });
    }
    else if (s == '2*3*4*1') {
        console.info(s)
        var id
        let t = new trId({
            transType: 'credit',
            transDtInit: new Date(),
            transAcctInit: u.account_no,
            amt: amtTran,
            tranExed: false,
            transcID: Math.floor(Math.random() * 10000000000)
        })
        t.save((e, r) => {
            if (e) console.info(e)
            id = r['transcID'];
            let response = `END Go to our nearest agent and finalise your savings
                this id the ${r['transID']}
                Have a nice day`
        });
    } else if (s == '2*3*5*1') {
        console.info(s)
        var id
        let t = new trId({
            transType: 'credit',
            transDtInit: new Date(),
            transAcctInit: u.account_no,
            amt: amtTran,
            tranExed: false,
            transcID: Math.floor(Math.random() * 10000000000)
        })
        t.save((e, r) => {
            if (e) console.info(e)
            id = r['transcID'];
            let response = `END Go to our nearest agent and finalise your savings
                this id the ${r['transID']}
                Have a nice day`
        });
    } else if (s == '2*3*6*1') {
        console.info(s)
        var id
        let t = new trId({
            transType: 'credit',
            transDtInit: new Date(),
            transAcctInit: u.account_no,
            amt: amtTran,
            tranExed: false,
            transcID: Math.floor(Math.random() * 10000000000)
        })
        t.save((e, r) => {
            if (e) console.info(e)
            id = r['transcID'];
            let response = `END Go to our nearest agent and finalise your savings
                this id the ${r['transID']}
                Have a nice day`
        });
    } else if (s == '2*3*7*1') {
        console.info(s)
        var id
        let t = new trId({
            transType: 'credit',
            transDtInit: new Date(),
            transAcctInit: u.account_no,
            amt: amtTran,
            tranExed: false,
            transcID: Math.floor(Math.random() * 10000000000)
        })
        t.save((e, r) => {
            if (e) console.info(e)
            id = r['transcID'];
            let response = `END Go to our nearest agent and finalise your savings
                this id the ${r['transID']}
                Have a nice day`
        });
    } else if (s == '2*3*8*1') {
        console.info(s)
        var id
        let t = new trId({
            transType: 'credit',
            transDtInit: new Date(),
            transAcctInit: u.account_no,
            amt: amtTran,
            tranExed: false,
            transcID: Math.floor(Math.random() * 10000000000)
        })
        t.save((e, r) => {
            if (e) console.info(e)
            id = r['transcID'];
            let response = `END Go to our nearest agent and finalise your savings
                this id the ${r['transID']}
                Have a nice day`
        });
    } else if (s == '2*3*9*1') {
        console.info(s)
        var id
        let t = new trId({
            transType: 'credit',
            transDtInit: new Date(),
            transAcctInit: u.account_no,
            amt: amtTran,
            tranExed: false,
            transcID: Math.floor(Math.random() * 10000000000)
        })
        t.save((e, r) => {
            if (e) console.info(e)
            id = r['transcID'];
            let response = `END Go to our nearest agent and finalise your savings
                this id the ${r['transID']}
                Have a nice day`
        });
    } else if (s == '2*3*10*1') {
        console.info(s)
        var id
        let t = new trId({
            transType: 'credit',
            transDtInit: new Date(),
            transAcctInit: u.account_no,
            amt: amtTran,
            tranExed: false,
            transcID: Math.floor(Math.random() * 10000000000)
        })
        t.save((e, r) => {
            if (e) console.info(e)
            id = r['transcID'];
            let response = `END Go to our nearest agent and finalise your savings
                this id the ${r['transID']}
                Have a nice day`
        });
    }


    // else if (s.length == 12) {
    //     var uid = text.slice(2, 11)

    //     let response = `CON
    //     1. Sav`
    //     res.send(response);
    // }
    else {
        let response = `END Error processing your request check back later, Make sure you entered the correc information`
        res.send(response);
    }
})
router.get('/chkLog/:account_no', (req, res) => {
    if (userExists(req.params.account_no === true)) {
        var r = findOne({ account_no: req.params.account_no })
        res.json({ code: 1, user: r })
    } else res.json(0)
})
router.post('/withID', async (req, res) => {
    const u = await userSchema.findOne({ account_no: req.body.witAcct })
    if (u.acctBalance < parseInt(req.body.amt)) {
        res.json({ code: 00, msg: "insuficient funds" });
        return;
    }
    var uio = new transIDD({
        transType: 'Debit',
        transDtInit: new Date(),
        amt: req.body.amt,
        witAcct: req.body.witAcct,
        witName: req.body.witName,
        transcID: Math.floor(Math.random() * 10000000000),
        tranExed: false
    })
    uio.save(async (e, r) => {
        if (e) console.error(e)
        var u = await userSchema.findOne({ account_no: req.body.witAcct })
        var msg = `Dear Customer, This is your withdrawal voucher id: ${r['transcID']}
           Proceed to the neares santsi kudi agent to obtain your cash`
        oo(u.email, u.fullName, msg)
        res.json(r['transcID'])
    })

    // witIDD()
})
router.post('/genTranID', (req, res) => {
    try {
        var uio = new transIDD({
            transType: 'credit',
            transDtInit: new Date(),
            aod: req.body.aod,
            nod: req.body.nod,
            nor: req.body.nor,
            aor: req.body.aor,
            amt: req.body.amt,
            transcID: Math.floor(Math.random() * 10000000000),
            tranExed: false
        })
        uio.save(async (e, r) => {
            if (e) console.error(e)
            p = await userSchema({ account_no: req.body.aor })
            msg = `This is your transaction voucher ID ${r.transcID}
            This transaction of was initiated on ${new Date()}
            Go to the nearest santsi Kudi Agent to complete yout transaction`
            oo(p.email, p.fullName, msg)
            res.json(r)
        })
    } catch (e) {
        console.error(e)
    }
})
function witIDD(g) {
}
function getTrID(g) {
    var uio = new transIDD({
        transType: 'credit',
        transDtInit: new Date(),
        aod: g.aod,
        nod: g.nod,
        nor: g.nor,
        aor: g.aor,
        amt: g.amt,
        transcID: Math.floor(Math.random() * 10000000000),
        tranExed: false
    })
    uio.save((e, r) => {
        if (e) console.error(e)
        return r(['transcID']);
    })
}

router.get('/updAcct/:amount/:refNo/:nod/:aod/:aor/:nor', async (req, res) => {
    let t = new deposit({
        dateOfTransaction: new Date(),
        nameOfDepostor: req.params.nod,
        account_noOfDepositor: req.params.aod,
        amountDeposited: req.params.amount,
        account_noOfReceipient: req.params.aor,
        nameOfReceipient: req.params.nor,
        refNo: req.params.refNo
    })
    try {
        t.save(async (e, uu) => {
            if (e) throw 0;
            const p = await userSchema.findOne({ account_no: req.params.aor })
            p.acctBalance = Math.ceil(parseInt(p.acctBalance) + parseInt(req.params.amount))
            var ppp = await p.save();
            msg = `Dear Customer, ${req.params.amount} was credited to you account by ${req.params.nod}
            on ${new Date()} your new account balance is ${p.acctBalance}`
            console.info(ppp.acctBalance)
            oo(p.email, p.fullName, msg)
            res.json(ppp)
        })


    } catch (e) {
        console.info(e)
    }
}).get('/retrCred/:account_no', (req, res) => {
    try {
        deposit.find({ account_noOfReceipient: req.params.account_no }, (e, r) => {
            if (e) { r.json({ code: 0, error: e }); throw "unable to retrieve account history" }
            res.json(r)
        })
    } catch (e) {
        res.json({ code: 0, error: e })
    }
}).get('/retrDebit/:account_no', (req, res) => {
    console.info(req.params.account_no)
    try {
        dbt.find({ account_no: req.params.account_no }, (e, r) => {
            if (e) { r.json({ code: 0, error: e }); throw "unable to retrieve withdrawal history" }
            console.info(r)
            res.json(r)
        })
    } catch (e) {
        res.json({ code: 0, error: e })
    }
})
router.get('/retrAcctBal/:account_no', (req, res) => {
    try {
        userSchema.findOne({ account_no: req.params.account_no }, (e, r) => {
            if (e) throw "unable to retrieve accouont balance"
            res.json(r['acctBalance'])
        })
    }
    catch (err) {
        console.info(err)
        res.json(err)
    }
}).get('/chAcct/:account_no', (req, res) => {
    console.info(req.params.account_no)
    try {
        userSchema.findOne({ account_no: req.params.account_no }, (e, r) => {
            if (e) console.error(e)
            else if (r == null || undefined)
                res.json({ code: 2, msg: 'not found', })
            else
                res.json({ code: 1, name: r['fullName'], contact: r['contact'], account_no: r['account_no'] })
        })
    }
    catch (err) {
        res.json({ code: 0, msg: err })
    }
}).get('/logout/:account_no', async (req, res) => {
    console.info(user)
    var p = await userSchema.findOne({ account_no: req.params.account_no })
    user.pop(p)
    console.info(user)

})

router.post('/register', (req, res, next) => {
    // console.info(req.body)
    let ip
    if (req.headers['x-forwarded-for'])
        ip = req.headers['x-forwarded-for'].split(',')[0]
    if(req.connection && req.connection.remoteAddress)
        ip = req.connection.remoteAddress
    else 
        ip = req.ip
    
    let u = new userSchema({
        account_no: Math.floor(Math.random() * 10000000000),
        address: req.body.address,
        acctType: req.body.type,
        email: req.body.email,
        fullName: req.body.name,
        verified: false,
        dateOfRegistration: new Date(),
        contact: req.body.contact,
        abtBiz: req.body.abtBiz,
        acctBal: 0.00,
        bvn: '',
        nameOfBiz:req.body.nameOfBiz,
        cacId:req.body.cacId,
        DOI:new Date(),
        industry:req.body.industry,
        bizAddress:req.body.bizAddress,
        bizContact:req.body.bizContact,
        bizEmail:req.body.bizEmail,
        sizeOfBiz:req.body.sizeOfBiz,
        gender:req.body.sex
    });
    var up = __dirname + '/images/' + 'FLIPCON_'+Math.floor(Math.random() * 10000000000) + '.png';
    let a = req.files.photo
    try {
        a.mv(up, (err) => {
            if (err) console.info(err)
            console.info('sarkses' + up)
            console.info('ip: ' + req.ip)
            u['location']['longitude']= req.body.location[0]
            u['location']['latitude']= req.body.location[1]
            u.ipAddress = ip
            u.photo = up
            // u.password = cr
            u.setPassword(req.body.pwd);
            
            u.save((err, ukk) => {
            if (err) res.json({ code: 0, msg: err.message, id: null })
            var msg = `You have been successfully registered on Flipcon. 
            Here is your Account Number ${ukk.account_no}
            Have a nice day`
            ukk.salt = ''
            ukk.hash = ''
            console.info(ukk)
            // oo(ukk.email, ukk.fullName, msg)
            // console.info(ukk)
            res.json({ code: 1, msg: "successfully registered, check your mail for your details"})
        })
    })
}
    catch (e) {
        console.info('error: ' + e)
    }
   
    // try {

    //     })
    // } catch (a) {
    //     res.json('an error occured while registering')
    // }
})
var user = []

// function add(arr, name) {
//     const { length } = arr;
//     const id = length + 1;
//     const found = arr.some(el => el.username === name);
//     if (!found) arr.push({ id, username: name });
//     return arr;
//   }

function userExists(account_no) {
    return user.some(function (el) {
        return el.account_no === account_no;
    });
}

router.post('/login', (req, res) => {
       
    userSchema.findOne({ account_no : req.body.id }, function(err, user) { 
        if (user === null) { 
            return res.json({ code: 0, msg: "wrong account number" })
        } 
        else { 
            if (user.validPassword(req.body.pwd)) { 
                user.salt = ''
                user.hash = ''
                return res.json({ code: 1, msg: 'successfully signed in', user: user })

            } 
            else { 
                return  res.json({ code: 0, msg: 'wrong password' })
            } 
        } 
    }); 
    
    
    // try {
    //     userSchema.findOne({ account_no: req.body['id'] }, function (e, r) {
    //         if (e) return console.info(e);
    //         else if (r == null) res.json({ code: 0, msg: "wrong account number" })
    //         else {
    //             if (r['password'] == req.body['pwd']) {
    //                 res.json({ code: 1, msg: 'successfully signed in', user: r })
    //                 if (userExists(r['account_no'] === true)) {
    //                     user.push(r);
    //                 }
    //                 console.log(user)
    //             } else res.json({ code: 0, msg: 'wrong password' })
    //         }
    //     })
    // } catch (e) {
    //     switch (e) {
    //         case 0: res.json({ code: 0, msg: "wrong account number", metadata: e })
    //     }
    // }

})

function transferSt(fromAccount, toAccount, amt, Oname, Rname) {
    sterling.Account.InterbankTransferReq({
        sandbox_key: sandboxKey,
        payload: {
            Referenceid: sTrefId,
            RequestType: sTrefTyp,
            Translocation: sTtransLoc,
            ToAccount: toAccount,
            Destinationbankcode: '01',
            SessionID: '01',
            FromAccount: fromAccount,
            Amount: amt,
            NEResponse: '01',
            BenefiName: Rname,
            PaymentReference: '01',
            OriginatorAccountName: Oname || 'Santsi Kudii',
            translocation: '01'
        },
        sterlingHeader
    }).then(res => {
        console.info(res);
    }).catch(e => {
        console.info(e);
    })
}

function nameEnquiry(aNo) {
    return sterling.Transfer.InterbankNameEnquiry({
        sandbox_key: sandboxKey,
        params: {
            Referenceid: '01',
            RequestType: '01',
            Translocation: '01',
            ToAccount: aNo,
            destinationbankcode: "000001"
        },
        subscription_key: 't',
        Appid: '69',
        ipval: '0',
        host: 'https://sandboxapi.fsi.ng'

    })
}
router.post('/transferFunds/:account_no', (req, res) => {

    nameEnquiry(req.params.account_no)

})

module.exports = router;

