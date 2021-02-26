var express = require("express");
const router = express.Router();
const req = require('request')
const util = require('util');
const request = util.promisify(req);
const axios = require('axios')
const { sterling, nibss, union } = require("innovation-sandbox");
const Email = require('smtp-server')
var cookieParser = require('cookie-parser');
var session = require('express-session');

// import schemas here
const userSchema = require('./schemas/user')
const deposit = require('./schemas/deposits')

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
router.get('/chkLog', (req, res) => {
    if (user != '' || null || undefined) res.json({ code: 1, user: user })
    else res.json(0)
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
            p.save(async(e, s) => {
                if (e) res.json({ code: 0, msg: e.message, id: null })
            })
        })

    } catch (e) {
        console.info(e)
    }
}).get('/retrCred/:account_no', (req, res) => {
    try {
        deposit.find({ account_noOfReceipient:req.params.account_no }, (e, r) => {
            if (e) { r.json({ code: 0, error: e }); throw "unable to retrieve account history" }
            console.info(r)
            res.json(r)
        })
    } catch (e) {
        res.json({ code: 0, error: e })
    }
})
router.get('/retrDebit/:account_no', (req, res) => {
    try {
        wittdraw.find({ account_no: req.params.account_no }, (e, r) => {
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
        res.json(err)
    }
})

router.post('/register', (req, res, next) => {
    let u = new userSchema({
        account_no: Math.floor(Math.random() * 1000000000),
        state: req.body.state,
        address: req.body.address,
        acctType: req.body.type,
        email: req.body.email,
        password: req.body.pwd,
        fullName: req.body.firstName + " " + req.body.lastName,
        verified: false,
        dateOfRegistration: new Date(),
        contact: req.body.contact,
        acctBalance: 0,
        bvn: ''
    });

    try {
        u.save((err, ukk) => {
            if (err) res.json({ code: 0, msg: err.message, id: null })
            console.info(ukk)
            res.json({ code: 1, msg: "successfully registered", id: ukk['account_no'] })
        })
    } catch (a) {
        res.json('an error occured while registering')
    }
})
var user = null;
router.post('/login', (req, res) => {
    // user = req.body;
    try {
        userSchema.findOne({ account_no: req.body['id'] }, function (e, r) {
            if (e) return console.info(e);
            else if (r == null) res.json({ code: 0, msg: "wrong account number" })
            else {
                if (r['password'] == req.body['pwd']) {
                    res.json({ code: 1, msg: 'successfully signed in' })
                    user = r
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


    //     goat().then(async p => {
    //         console.info(await p)
    //     }).catch((e) => console.log(e));
    //    async function goat() {
    //             // optionos = 
    //             data = {
    //                 uri: "https://sandboxapi.fsi.ng/sterling/accountapi/api/Spay/InterbankTransferReq",
    //                 method: 'POST',
    //                 options: {
    //                     headers: {
    //                         'Sandbox-Key': sandboxKey,
    //                         'Ocp-Apim-Subscription-Key': "t",
    //                         'Ocp-Apim-Trace': 'true',
    //                         Appid: "69",
    //                         'Content-Type': 'application/json',
    //                         ipval: "0",
    //                     },
    //                     body: {
    //                         "Referenceid": "0101",
    //                         "RequestType": "0101",
    //                         "Translocation": "0101",
    //                         "SessionID": "01",
    //                         "FromAccount": "01",
    //                         "ToAccount": "01",
    //                         "Amount": "01",
    //                         "DestinationBankCode": "01",
    //                         "NEResponse": "01",
    //                         "BenefiName": "01",
    //                         "PaymentReference": "01",
    //                         "OriginatorAccountName": "01",
    //                         "translocation": "01"
    //                     },
    //                     json: true,
    //                 }
    //             }
    //             return await (await request(data)).headers;
    //         }
    // axios({
    // 	method: 'post',
    // 	baseURL: 'https://sandboxapi.fsi.ng',
    // 	url: '/sterling/accountapi/api/Spay/InterbankTransferReq',
    // 	data: {
    // 		Referenceid: "01",
    // 		RequestType: "01",
    // 		Translocation: "01",
    // 		SessionID: "01",
    // 		FromAccount: "01",
    // 		ToAccount: "01",
    // 		Amount: "01",
    // 		DestinationBankCode: "01",
    // 		NEResponse: "01",
    // 		BenefiName: "01",
    // 		PaymentReference: "01",
    // 		OriginatorAccountName: "01",
    // 		translocation: "01"
    // 		},
    // 	headers: {
    // 		"Sandbox-Key": sandboxKey,
    // 		"Ocp-Apim-Subscription-Key": "t",
    // 		"Ocp-Apim-Trace": "true",
    // 		"Appid": "69",
    // 		"Content-Type": "application/json",
    // 		"ipval": 0
    // 		}
    // 	})
    // 	.then((response) => {console.log(response.data)})
    // 	.catch((error) => console.log(error))
});


module.exports = router;

