var express = require("express");
const router = express.Router();
const req = require('request')
const util = require('util');
const request = util.promisify(req);
const axios = require('axios')
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
const trId = require('./schemas/transactionIDs')
const ussd = require('./schemas/ussd') 
// import schemas here
const userSchema = require('./schemas/user')
const deposit = require('./schemas/deposits');
const { findOne } = require("./schemas/user");
const e = require("express");
const { response } = require("express");

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
                var ff = await p.save()
                res.json(ff)
                // res.json()
            } default: {
                var p = await userSchema.findOne({ account_no: req.params.id })
                p.bvn = r['data'];
                p.verified = true;
                var ff = await p.save()
                res.json(ff)
            }
        }
    })

}).get('/loanHis/:id', async (req, res) => {
    var k = await loan.find({ acctId: req.params.id })
    res.json(k)
}).get('/loans', async (req, res, next) => {
    var ds = await loan.find({ offered: false || null })
    // console.info(ds)
    res.json(ds)
    return;
})

router.post('/loan', async (req, res) => {
    var k = new loan({
        reason: req.body.a.reason,
        summary: req.body.a.summary,
        intRate: req.body.a.type,
        duration: req.body.a.duration,
        amount: req.body.a.amount,
        dateOfRequest: new Date(),
        aboutBusiness: req.body.abtBiz,
        acctId: req.body.acctId,
        loanId: Math.floor(Math.random() * 10000000000)
    })
    p = await k.save()
    res.json(p)
})

router.post('/submitOffer', async (req, res) => {
    var d = await loan.findOne({ loanId: req.body.offer.id })
    d.VCOffer = {
        intRate: req.body.offer.intRate,
        amount: req.body.offer.amt,
        msg: req.body.offer.msg,
        duration: req.body.offer.years,
        acctId: req.body.id
    }
    d.offered = true
    console.log(await d.save())
    const f = new offer({
        dateOfoffer: new Date(),
        loanId: req.body.offer.id,
        amt: req.body.offer.amt,
        intRate: req.body.offer.intRate,
        years: req.body.offer.years,
        id: req.body.id,
        idofrecepient: req.body.offer.idd
    })
    res.json(await f.save())
})
router.get('/getOffers/:id', async (req, res) => {
    res.json(await offer.find({ id: req.params.id }))
})
router.get('/rejOffer/:id', async (req, res) => {
    var s = await offer.findOne({ loanId: req.params.id })
    s.accepted = false;
    s.save()
    var d = await loan.findOne({ loanId: req.params.id })
    d.VCOffer = '';
    d.offered = false
    d.save()
    res.json({ a: 'offer rejected' })
}).get('/accOffer/:id', async (req, res) => {
    var s = await offer.findOne({ loanId: req.params.id })
    s.accepted = true;
    s.save()
    var d = await loan.findOne({ loanId: req.params.id })
    d.save()
    res.json({ a: 'offer accepted' })
})

router.post('/withdrawal', async (req, res) => {
    try {
        const u = await userSchema.findOne({ account_no: req.body.id })
        if (u.acctBalance < parseInt(req.body.amt)) {
            res.json({ code: 00, msg: "insuficient funds" });
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
        res.json({
            msg: 'Successful withdrawal from your account , open the Africa' +
                'Talking simuator to view your alert'
        })
    } catch (ex) {
        console.error(ex);
    }
})
        var uPin;
        var acctNoToTransferTo;  var u;
router.post('/ussd', async (req, res) => {
    let { sessionId, serviceCode, phoneNumber, text } = req.body;
    // console.log(req.body)
    // var u;
    userSchema.findOne({ contact: phoneNumber.toString().slice(1,14) },(e,r)=>{
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
 
    var amtTran;
    var s=text.toString()    

        if (s == '') {
            let response;
            const uuser = new ussd()
            console.info(await ussd.findOne({contact:phoneNumber.toString().slice(1,14)}))
            ussd.findOne({contact:phoneNumber.toString().slice(1,14)}, (e,r)=>{
                console.info(phoneNumber.toString().length)
                console.info(phoneNumber.toString().slice(1,14))
                if(e){
                    console.error('deed'+e)
                }else if (r == null){
                    console.info(r)
                        uuser.contact = phoneNumber.toString().slice(1,14)
                        uuser.save((e,r)=>{
                        if(e)console.info(e)
                        console.info(r)
                     res.send(response);
                    })
                }else{
                    response = `CON Welcome to Santsu Kudi
                    Choose Language
                    1. English
                    2. Hausa`
                    res.send(response)
                }
               
               
            })
            // uuser.contact = phoneNumber.toString().slice(1,13)
            // uuser.save((e,r)=>{
            //     if(e)console.info(e)
              
            //     console.info(r)
            //     res.send(response);
            // })
            // console.info()
           
        }
    else if (s =='1') {
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
        else if(s =='1*1') {
                let response = `CON choose where to pay to
                    1. A Financial Institution(Bank) Account
                    2. A Santsi Account Balance
                    
                    ...Santsi Kudi`
                res.send(response);
            }
                else if(s =='1*1*1'){
                    console.info(text.toString().length)
                    let response = `CON input the Bank account account no to pay to`
                    res.send(response);
                }
                    else if (s == '1*1*1*'+s.slice(5,16)){
                    console.info(text.toString().length)
                        let response;
                     var ne = await nameEnquiry(text.slice(5,16))
                     acctNoToTransferTo = ne.data.data.AccountNumber;

                            if(ne.message == 'OK'){
                                response = `CON Account details retun from the 
                                sandbox name enquiry  
                                message: ${ne.data.message}
                                reponse: ${ne.data.response}
                                account number : ${ne.data.data.AccountNumber}
                                account status : ${ne.data.data.status}
                                select 1 to proceed`
                                res.send(response)
                            }else{
                            response = `END Wrong Account Number`
                            res.send(response)
                             }
                        
                        }
                        else if(s == s.slice(0,16) + '*1'){
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
                        else if(s == s.slice(0,16) + '*1*1'){
                            amtTran = 100000
                            let response = `CON Transfering #1,000.00 to
                             ${acctNoToTransferTo}
                            input your pin to complete payment`
                            res.send(response)
                        }
                        else if(s == s.slice(0,16) + '*1*2'){
                            
                            amtTran = 200000
                            let response = `CON Transfering #2,000.00 to ${nacctNoToTransferToe}
                            input your pin to complete payment`
                            res.send(response)
                        } else if(s == s.slice(0,16) + '*1*3'){
                            amtTran = 500000
                            let response = `CON Transfering #5,000.00 to ${acctNoToTransferTo}
                            input your pin to complete payment`
                            res.send(response)
                        } else if (s == s.slice(0,16) + '*1*4'){
                            amtTran = 700000
                            let response = `CON Transfering #7,000.00 to ${acctNoToTransferTo}
                            input your pin to complete payment`
                            res.send(response)
                        } else if (s == s.slice(0,16) + '*1*5'){
                            amtTran = 1000000
                            let response = `CON Transfering #10,000.00 to ${nacctNoToTransferToe}
                            input your pin to complete payment`
                            res.send(response)
                        } else if (s == s.slice(0,16) + '*1*6'){
                            amtTran = 15000000
                            let response = `CON Transfering #15,000.00 to ${acctNoToTransferTo}
                            input your pin to complete payment`
                            res.send(response)
                        } else if(s == s.slice(0,16) + '*1*7'){
                            amtTran = 2000000
                            let response = `CON Transfering #20,000.00 to ${acctNoToTransferTo}
                            input your pin to complete payment`
                            res.send(response)
                        }  else if(s == s.slice(0,16) + '*1*8'){
                            amtTran = 5000000
                            let response = `CON Transfering #50,000.00 to ${acctNoToTransferTo}
                            input your pin to complete payment`
                            res.send(response)
                        } else if(s == s.slice(0,16) + '*1*9'){
                            amtTran = 10000000
                            let response = `CON Transfering #100,000.00 to ${acctNoToTransferTo}
                            input your pin to complete payment`
                            res.send(response)
                        } else if(s == s.slice(0,16) + '*1*10'){
                            amtTran = 20000000
                            let response = `CON Transfering #200,000.00 to ${acctNoToTransferTo}
                            input your pin to complete payment`
                            res.send(response)
                        } 
                        else if(s == s.slice(0,16) + '*1*10'+s.slice(21,25)){
                            let response;
                            o = ussd.findOne({contact:phoneNumber})
                            if (o.pin == null || undefined) {
                                response = `END go to main menu andcreate a pin. To perform transactions on Santsi kudi`
                                res.send(response)
                                return;
                            }
                            else if (o.pin != text.slice(21,25)){
                                response = `END wrong pin, check your pin and try again later`
                                res.send(response)
                                return;
                            }
                            else if (o.pin == text.slice(21,25)){

                            }
                            response = `CON Transfering #200,000.00 to ${ne}
                            input your pin to complete payment`
                            res.send(response)
                        }
        else if(s =='1*2') {
            
            let response =  `END Here is you account balance ${u.acctBalance}
            Have a nice day`
            res.send(response)
        }
        else if(s =='1*5') {
            let response
          try{  ussd.findOne({contact: phoneNumber.toString().slice(1,14)},(e,u)=>{
                if(e)throw "not found";
                if (u.pin == null || undefined){
                    response = `CON set a four digits pin e.g 1234`
                    res.send(response)
                }else{
                    response = `CON pin already set
                    press 1 to set new pin`
                    res.send(response)
                }
            })
            // u.
            }
            catch(err){console.error(err)}
        }
        else if (s =='1*5*1'){
            let response = `CON input old pin`
            res.send(response)
            
        }
        

        else if(s == '1*5*1*' + s.slice(6,10)){
            console.log(s.slice(6,10))
            let response
            var b = await ussd.findOne({contact:phoneNumber.toString().slice(1,14)})
            console.info(b)
            if (b.pin != s.slice(6,10)){
                console.log(s.slice(6,10))
                console.log(s.slice(6,9))
                response = `END wrong pin, try again later` 
                res.send(response)
            }else{
                response = `CON Input new pin e.g 1234`
                res.send(response)
            }
        }
        else if(s == '1*5*1*' + s.slice(6,10) + '*'+s.slice(12)){

            var b = await ussd.findOne({contact:phoneNumber.toString().slice(1,14)})
            b.pin = s.slice(12);
            var finished = await b.save()
            let response = `END Your pin has successfully be set ${finished.pin}`
            res.send(response)
                 
        }
            else if (s =='1*5*'+ s.slice(4,8)){
                var b = await ussd.findOne({contact:phoneNumber.toString().slice(1,14)})
               console.info(b)
               let response
               console.info(s)
               console.info(s.slice(4,8))
               b.pin = s.slice(4,8);
                var finished = await b.save((e,r)=>{
                    if(e) console.error(e)
                    response = `END Your pin has successfully be set ${r.pin}`
                    res.send(response)
                })
                //  = `END Your pin has successfully be set ${finished.pin}`
            }
            
        else if(s =='1*3') {
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
        else if(s == '1*3*1'){

            amtTran = 100000
            let response = `CON Save #1,000.00 to
             your account no ${u.account_no}
            input your pin to complete payment`
            res.send(response)
        }
        else if(s == '1*3*2'){
            
            amtTran = 200000
            let response = `CON Save #2,000.00 to ${u.account_no}
            input your pin to complete payment`
            res.send(response)
        } else if(s == '1*3*3'){
            amtTran = 500000
            let response = `CON Save #5,000.00 to ${u.account_no}
            select mode of payment
            1. Agent
            2. Airtime
            3. Account`
            res.send(response)
        } else if (s == '1*3*4'){
            amtTran = 700000
            let response = `CON Save #7,000.00 to ${u.account_no}
            select mode of payment
            1. Agent
            2. Airtime
            3. Account`
            res.send(response)
        } else if (s == '1*3*5'){
            amtTran = 1000000
            let response = `CON Save #10,000.00 to ${u.account_no}
            select mode of payment
            1. Agent
            2. Airtime
            3. Account`
            res.send(response)
        } else if (s == '1*3*6'){
            amtTran = 15000000
            let response = `CON Save #15,000.00 to ${u.account_no}
            select mode of payment
            1. Agent
            2. Airtime
            3. Account`
            res.send(response)
        } else if(s == '1*3*7'){
            amtTran = 2000000
            let response = `CON Save #20,000.00 to ${u.account_no}
            select mode of payment
            1. Agent
            2. Airtime
            3. Account`
            res.send(response)
        }  else if(s == '1*3*8'){
            amtTran = 5000000
            let response = `CON Save #50,000.00 to ${u.account_no}
            select mode of payment
            1. Agent
            2. Airtime
            3. Account`
            res.send(response)
        } else if(s == '1*3*9'){
            amtTran = 10000000
            let response = `CON Save #100,000.00 to ${u.account_no}
            select mode of payment
            1. Agent
            2. Airtime
            3. Account`
            res.send(response)
        } else if(s == '1*3*10'){
            amtTran = 20000000
            let response = `CON Save #200,000.00 to ${u.account_no}
            select mode of payment
            1. Agent (generate voucher)
            2. Airtime
            3. Account`
            res.send(response)
        }
        else if(s == '1*3*1*1' 
        || '1*3*2*1'
        || '1*3*3*1'
        || '1*3*4*1'
        || '1*3*5*1'
        || '1*3*6*1'
        || '1*3*7*1'
        || '1*3*8*1'
        || '1*3*9*1'
        || '1*3*10*1'){
            console.info(s)
            var id
            let t = new trId({
                transType: 'credit',
                transDtInit: new Date(),
                transAcctInit:u.account_no,
                amt:amtTran,
                tranExed: false,
                transcID: Math.floor(Math.random() * 10000000000)
            })
            t.save((e,r)=>{
                if(e)console.info(e)
                id = r['transcID'];
                let response = `END Go to our nearest agent and finalise your savings
                this id the ${r['transID']}
                Have a nice day`
            });
        }

        else if (s.length == 12) {
            var uid = text.slice(2, 11)

            let response = `CON
            1. Sav`
            res.send(response);
        }
            // {
                //    case '2': {
                //         let response = `CON Thanks for choosing Hausa ${phoneNumber}
                //             1. Register
                //             2. Login
                //         `
                //         res.send(response);
                //         break;
                //     }
                //     case '2*1': {
                //         let response = `CON Enter Your details in this format
                //         Fulname : Business Address : State where business is located : Business Name : No. of Employees : Secret code
                //         Example:
                //         Shehu Aminat : 12, kaaro cl, Maitama Abuja : Kaduna : Ramat wears : 10 : 3423`
                //         res.send(response);
                //         break;
                //     } case '2*1*': {
                //         let response = `END You have successfully Registered your Business with Santsi Kudi
                //         Your Account No. is 9092772635`
                //     }
                //     case '2*2': {
                //         let response = `CON Enter Your Account No.`
                //         res.send(response);
                //         break;
                //     }
                //     case text.length == 14: {
                //         let response = `CON Enter Your secret pin`
                //         res.send(response);
                //         break;
                //     }
                //     case text.length == 18: {
                //         let response = `END ${text.split('*')}`
                //         res.send(response)
                //         console.info(response)
                //     }
            // }
        else {
            let response = `END Error processing your request check back later, Make sure you entered the correc information`
            res.send(response);
        }
    // }
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

function transferSt(fromAccount,toAccount,amt,Oname,Rname){
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
            OriginatorAccountName: Oname||'Santsi Kudii',
            translocation: '01'
        },
        sterlingHeader
    }).then(res => {
        console.log('InterbankTransferReq', res)
    }).catch(e => {
        console.info(e);
    })
}

function nameEnquiry(aNo){
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

