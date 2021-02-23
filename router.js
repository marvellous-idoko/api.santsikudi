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
            let response = `END Thanks for choosing English ${phoneNumber}`
            res.send(response);
            break;
        }
        case 2:
        case '2': {
            let response = `END Thanks for choosing Hausa ${phoneNumber}`
            res.send(response);
            break;
        }

        default: {
            let response = `END Error processins your request ${phoneNumber}`
            res.send(response);
            break;
        }
    }
})

module.exports = router;

