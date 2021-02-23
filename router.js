var express = require("express");
const router = express.Router();


router.use(express.json());
router.use(express.urlencoded({ extended: true }));

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
        case   1:
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
        case 2*1:
        case '2*1': {
            let response = `CON Enter Your details in this format
            Fulname : Business Address : State where business is located : Business Name : No. of Employees : Secret code
            Example:
            Shehu Aminat : 12, kaaro cl, Maitama Abuja : Kaduna : Ramat wears : 10 : 3423`
            res.send(response);
            break;
        }case '2*1*':{
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
        case text.length == 18:{
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

module.exports = router;

