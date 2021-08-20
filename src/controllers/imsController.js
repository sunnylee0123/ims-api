const { getIms, getImsByNumber, saveIms, deleteIms, validatePhoneNumber, validateIMS } = require('../services/imsService');
const logger = require('../util/log');

const getSubscribers = async (req, res) => {
    try {
        const result = await getIms();
        if (!result || result.length === 0) {
            return res.status(404).send('No records found in database');    
        }
        return res.send(result);
    } catch (ex) {
        return res.status(500).send("Failed to get all IMS records");
    }
}

const getSubscriberByNumber = async (req, res) => {
    const pNumber = req.params.number;
    
    //validate phone number
    const error = validatePhoneNumber(pNumber);
    if (error) {
        logger.error(`[IMS CONTROLLER]: `, error);
        return res.status(400).send("Phone number must be 11 digits long.");
    }
    
    try {
        const result = await getImsByNumber(pNumber);
        if (!result) {
            return res.status(404).send(`No record found for number ${pNumber}`);    
        }
        return res.send(result);
    } catch (ex) {
        return res.status(500).send(`Failed to get IMS for number ${pNumber}`);
    }
}

const updateSubscriberByNumber = async (req, res) => {
    const pNumber = req.params.number;
    
    //validate phone number
    let error = validatePhoneNumber(pNumber);
    if (error) {
        logger.info(`[IMS CONTROLLER]: `, error);
        return res.status(400).send("Phone number must be 11 digits long.");
    }

    const record = req.body;

    //validate request body
    error = validateIMS(record);
    if (error) {
        logger.info(`[IMS CONTROLLER]: `, error);
        return res.status(400).send(error.details[0].message);
    }
    
    try {
        const result = await saveIms(pNumber, record);
        return res.send(result);
    } catch (ex) {
        if (ex.code === "23505" || ex.message === "already exists") {
            return res.status(400).send(`You cannot update the phoneNumber ${pNumber} to ${record.phoneNumber}: the number ${record.phoneNumber} already exists in the database.`);
        } else {
            return res.status(500).send(`Failed to update IMS for number ${pNumber}`);
        }
    }
}

const deleteSubscriberByNumber = async (req, res) => {
    const pNumber = req.params.number;
    //validate phone number
    const error = validatePhoneNumber(pNumber);
    if (error) {
        logger.info(`[IMS CONTROLLER]: `, error);
        return res.status(400).send("Phone number must be 11 digits long.");
    }

    try {
        const result = await deleteIms(pNumber);
        if (!result) {
            return res.status(404).send(`No record found for number ${pNumber}`);    
        }
        return res.send(`Deleted record: ${result}`);
    } catch (ex) {
        return res.status(500).send(`Failed to delete IMS for number ${pNumber}`);
    }
}

module.exports = {
    getSubscribers,
    getSubscriberByNumber,
    updateSubscriberByNumber, 
    deleteSubscriberByNumber
}