var express = require("express");
const router = express.Router();
const req = require('request')
const util = require('util');
const request = util.promisify(req);
const axios = require('axios')
const { sterling, nibss, union } = require("innovation-sandbox");
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
// import schemas here
const userSchema = require('./schemas/user')
const deposit = require('./schemas/deposits');
const { findOne } = require("./schemas/user");

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
router.post('/sms', (req, res) => {
    apiKey = "1e4af632fde243b21fa1c28ee43fc71f3a84c6f89e6604f6b29d5afb9f328c65"
    username = 'sandbox'
})
router.get('/verifyBVN/:bvn/:id', (req, res) => {
   
    nibss.Bvnr.VerifySingleBVN({
        bvn: req.params.bvn,
        sandbox_key: '37de4935bccdfa335f59b3783a0368d0',
        organisation_code: '11111',
        password: "^o'e6EXK5T ~^j2=",
        ivkey: 'eRpKTBjdOq6T67D0',
        aes_key: '9+CZaWqfyI/fwezX',
        host: 'https://sandboxapi.fsi.ng'
    }).then(async r => {
       switch (r){
        case undefined:{
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
              const p  = await userSchema.findOne({account_no:req.params.id})
            p.bvn =  data;
            p.verified = true;
            var ff = await p.save()
            res.json(ff)
            // res.json()
        }default:{
            var p  = await userSchema.findOne({account_no:req.params.id})
            p.bvn =  r['data'];
            p.verified = true;
            var ff = await p.save()
            res.json(ff)
        }
       }

       })

    }).get('/loanHis/:id', async(req,res)=>{
        var k = await loan.find({acctId:req.params.id})
        res.json(k)
    }).get('/loans',async(req,res,next)=>{
        var ds = await loan.find({offered: false || null})
        // console.info(ds)
        res.json(ds)
        return;
    })

router.post('/loan',async(req,res)=>{
    var k = new loan({
        reason:req.body.a.reason,
        summary:req.body.a.summary,
        intRate:req.body.a.type,
        duration:req.body.a.duration,
        amount:req.body.a.amount,
        dateOfRequest: new Date(),
        aboutBusiness: req.body.abtBiz,
        acctId: req.body.acctId,
        loanId:  Math.floor(Math.random() * 10000000000)
    })
    p = await k.save()
    res.json(p)
})
router.post('/submitOffer', async(req,res)=>{
   var d = await loan.findOne({loanId:req.body.offer.id})
   d.VCOffer = {
        intRate : req.body.offer.intRate,
        amount : req.body.offer.amt,
        msg : req.body.offer.msg,
        duration: req.body.offer.years,
        acctId: req.body.id
    }
    d.offered = true
    console.log(await d.save())
    const f = new offer({
        dateOfoffer: new Date(),
        loanId:req.body.offer.id,
        amt:req.body.offer.amt,
        intRate:req.body.offer.intRate,
        years:req.body.offer.years,
        id:req.body.id,
        idofrecepient: req.body.offer.idd
    })
    res.json(await f.save())
})
router.get('/getOffers/:id',async(req,res)=>{
    res.json(await offer.find({id:req.params.id}))
})
router.get('/rejOffer/:id', async(req,res)=>{
    var s = await offer.findOne({loanId:req.params.id})
    s.accepted = false;
    s.save()
   var d = await loan.findOne({loanId: req.params.id})
   d.VCOffer = '';
   d.offered = false
    d.save()
    res.json({a:'offer rejected'})  
}).get('/accOffer/:id', async(req,res)=>{
    var s = await offer.findOne({loanId:req.params.id})
    s.accepted = true;
    s.save()
   var d = await loan.findOne({loanId: req.params.id})
    d.save()
    res.json({a:'offer accepted'})
})

router.post('/withdrawal',async(req,res)=>{
    try {
        const u = await userSchema.findOne({account_no:req.body.id})
        if(u.acctBalance < parseInt(req.body.amt) ) {
            res.json({code:00,msg:"insuficient funds"});
            return;
        }
        u.acctBalance = Math.ceil(u.acctBalance - parseInt(req.body.amt));
          
        const result = await AT.SMS.send({
          to: '+2347057537572', 
          message: `Hello ${u.fullName} "\n" ${u.account_no} "\n" ${req.body.amt} was
           withdrawn from your account. Thank you `,
          from: 'Santsi Kudi'
        });
        console.log(result);
        res.json({msg:'Successful withdrawal from your account , open the Africa'+ 
        'Talking simuator to view your alert'},)
    } catch(ex) {
        console.error(ex);
      } 
})
router.post('/ussd', (req, res) => {
    let { sessionId, serviceCode, phoneNumber, text } = req.body;
    // console.log(req.body)
    switch (text) {
        case '': {
            let response = `CON Welcome to Santsu Kudi
                Choose Language
                1. English
                2. Hausa`
            res.send(response);
            break;
        }
        case 1:
        case '1': {
            let response = `CON Thanks for choosing English ${phoneNumber}
                1. Register
                2. Login
            `
            res.send(response);
            break;
        }
        case 2:
        case '2': {
            let response = `CON Thanks for choosing Hausa ${phoneNumber}
                1. Register
                2. Login
            `
            res.send(response);
            break;
        }
        case 2 * 1:
        case '2*1': {
            let response = `CON Enter Your details in this format
            Fulname : Business Address : State where business is located : Business Name : No. of Employees : Secret code
            Example:
            Shehu Aminat : 12, kaaro cl, Maitama Abuja : Kaduna : Ramat wears : 10 : 3423`
            res.send(response);
            break;
        } case '2*1*': {
            let response = `END You have successfully Registered your Business with Santsi Kudi
            Your Account No. is 9092772635`
        }
        case '2*2': {
            let response = `CON Enter Your Account No.`
            res.send(response);
            break;
        }
        case text.length == 14: {
            let response = `CON Enter Your secret pin`
            res.send(response);
            break;
        }
        case text.length == 18: {
            let response = `END ${text.split('*')}`
            res.send(response)
            console.info(response)
        }

        default: {
            let response = `END Error processing your request check back later ${phoneNumber}`
            res.send(response);
            break;
        }
    }
})
router.get('/chkLog/:account_no', (req, res) => {
    if (userExists(req.params.account_no === true)) {
        var r = findOne({ account_no: req.params.account_no })
        res.json({ code: 1, user: r })
    } else res.json(0)
})

router.get('/updAcct/:amount/:refNo/:nod/:aod/:aor/:nor', (req, res) => {
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
            console.info(uu)
            const p = await userSchema.findOne({ account_no: uu['account_noOfReceipient'] })
            p.acctBalance = Math.ceil(parseInt(p.acctBalance) + parseInt(t['amountDeposited']))
            p.save(async (e, s) => {
                if (e) res.json({ code: 0, msg: e.message, id: null })
            })
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
})
router.get('/retrDebit/:account_no', (req, res) => {
    try {
        witdraw.find({ account_no: req.params.account_no }, (e, r) => {
            if (e) { r.json({ code: 0, error: e }); throw "unable to retrieve withdrawal history" }
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
            if (e) throw "accouont doesn't exist on santsii kudi"
            res.json({ code: 1, name: r['fullName'], contact: r['contact'] })
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
    let u = new userSchema({
        account_no: Math.floor(Math.random() * 10000000000),
        state: req.body.state,
        address: req.body.address,
        acctType: req.body.type,
        email: req.body.email,
        password: req.body.pwd,
        fullName: req.body.firstName + " " + req.body.lastName,
        verified: false,
        dateOfRegistration: new Date(),
        contact: req.body.contact,
        abtBiz: req.body.abtBiz,
        acctBalance: 0,
        bvn: ''
    });
    try {
        u.save((err, ukk) => {
            if (err) res.json({ code: 0, msg: err.message, id: null })
            console.info(ukk)
            res.json({ code: 1, msg: "successfully registered", user: ukk })
        })
    } catch (a) {
        res.json('an error occured while registering')
    }
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
    console.log(req.body);
    try {
        userSchema.findOne({ account_no: req.body['id'] }, function (e, r) {
            if (e) return console.info(e);
            else if (r == null) res.json({ code: 0, msg: "wrong account number" })
            else {
                if (r['password'] == req.body['pwd']) {
                    res.json({ code: 1, msg: 'successfully signed in', user: r })
                    if (userExists(r['account_no'] === true)) {
                        user.push(r);
                    }
                    console.log(user)
                } else res.json({ code: 0, msg: 'wrong password' })
            }
        })
    } catch (e) {
        switch (e) {
            case 0: res.json({ code: 0, msg: "wrong account number", metadata: e })
        }
    }

})
router.post('/transferFunds', (req, res) => {
    sterling.Account.InterbankTransferReq({
        sandbox_key: sandboxKey,
        payload: {
            Referenceid: "0101",
            RequestType: "0101",
            Translocation: "0101",
            ToAccount: "01",
            Destinationbankcode: "01",
            SessionID: "01",
            FromAccount: "01",
            Amount: "01",
            NEResponse: "01",
            BenefiName: "01",
            PaymentReference: "01",
            OriginatorAccountName: "01",
            translocation: "  01"
        },
        subscription_key: "t",
        Appid: "69",
        ipval: "0",
        host: "https://sandboxapi.fsi.ng"
    }).then(res => {
        console.info(res)
    }).catch(e => {
        console.info(e);
    })
})




module.exports = router;

