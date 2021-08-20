const sql = require('sql');
const logger = require('../util/log');
const { IMSModel } = require('../models/imsModel');
const Joi = require("joi");
const format = require('pg-format');
const _ = require('lodash');
const db = require('./dbService');
const pool = db.getPool();


sql.setDialect('postgres');
const ims = sql.define(IMSModel);

//// Input validation ////

// Assumed that a phone number is a 11-digit number (area code + number), but more advanced packages exist for validating phone numbers in various formats and even whether a number is valid in a specific country, e.g. https://www.npmjs.com/package/joi-phone-number/v/3.0.1
const pNumberSchema = Joi.string().length(11).pattern(/^[0-9]+$/);

// Assumed that username and password are basic strings.
// Assumed that features can be an object with 0 to many items
    // If there are specific fields within a feature that requires validation, can add it here
const imsSchema = Joi.object({ 
    phoneNumber: pNumberSchema,
    username: Joi.string(),
    password: Joi.string(),
    domain: Joi.string().domain(),
    status: Joi.boolean(),
    //Can also validate each item within the features object
    features: Joi.object()
});

function validatePhoneNumber(pNumber) {
    return pNumberSchema.validate(pNumber)?.error;
}

function validateIMS(record) {
    return imsSchema.validate(record)?.error;
}

//// GET POST PUT Service functions ////

async function getIms() {
  try {
    const selectQuery = ims.select().from(ims).toQuery();
    const data = await pool.query(selectQuery);
    // Convert column names to camelCase
    const result = data.rows.map(item => { return _.mapKeys(item, (v, k) => _.camelCase(k)); })
    if (_.isEmpty(result)) {
        return false;
    } else {
        return result;
    }
  } catch (ex) {
    logger.error("[IMS SERVICE]: Get IMS db query failed: ", ex);
    return Promise.reject(ex);
  }
}

async function getImsByNumber(pNumber) {
    try {
      const selectQuery = ims.select().from(ims).where(ims.phone_number.equals(pNumber)).toQuery();
      const data = await pool.query(selectQuery);
      const result = _.mapKeys(data.rows[0], (v, k) => _.camelCase(k));
      if (_.isEmpty(result)) {
            return false;
        } else {
            return result;
        }
    } catch (ex) {
    logger.error("[IMS SERVICE]: Get IMS db query by number failed: ", ex);
      return Promise.reject(ex);
    }
  }

async function saveIms(pNumber, imsData) {  
    // Convert to snake_case
    const imsDataSC = _.mapKeys(imsData, (v, k) => _.snakeCase(k));

    // This function uses pg-format to format a prepared query, as the 'sql' package did not support proper upsert.
    // pg-format is used to avoid sql injection

    // Insertion of a new document is straightforward. To handle updates:
        // The Fields that are part of the request body will be updated, while the ones that are not explicitly defined in the request body will be left unchanged.    
        // To handle phoneNumber updates:
            // Check if phoneNumber is one of the fields to update.
            // If so, it will query against the old phoneNumber, and resolve it via the ON CONFLICT statement, assigning the phonenumber value to the new one.
        
    let newNumber;
    if (imsDataSC.phone_number && imsDataSC.phone_number !== pNumber) {
        try {
            // Check if new phonenumber to update to already exists in db; reject the request if true
            const result = await getImsByNumber(imsDataSC.phone_number);
            if (result) {
                throw new Error("already exists");
            }
            else {
                newNumber = imsDataSC.phone_number;
                imsDataSC.phone_number = pNumber;
            }
        } catch (ex) {
            logger.error("[IMS SERVICE]: Get IMS by phone number db query in update failed: ", ex);
            return Promise.reject(ex);
        }
    } else {
        newNumber = pNumber;
    }

    // Build query string, accounting for preventing sql injection
    const imsDataColumns = Object.keys(imsDataSC);
    const imsDataValues = imsDataColumns.map(item => { return imsDataSC[item] })

    const onConflictString = imsDataColumns.map(item => {
        return item !== "phone_number" ? `"${item}" = EXCLUDED."${item}"` : `"${item}" = ${newNumber}`
    }).join(', ');
    
    const formatQuery = format('INSERT INTO %I (%I) VALUES (%L) ON CONFLICT (%I) DO UPDATE SET %s', "ims", imsDataColumns, imsDataValues, "phone_number", onConflictString);

    // Run query
    try {
        await pool.query(formatQuery);
        logger.info(`[IMS SERVICE]: Inserted or updated IMS record for number ${pNumber}`);
        return imsData;
    } catch (ex) {
        if (ex.code === "23505") {
            logger.error(`[IMS SERVICE]: Cannot update ${pNumber} to ${newNumber}: already exists in the database`);
        } else {
            logger.error("[IMS SERVICE]: Update IMS by phone number db query failed: ", ex);
        }
        return Promise.reject(ex);
    }
}

async function deleteIms(pNumber) {  
    try {
        // Check if record exists. Could also run the delete query and check the result of the query
        const result = await getImsByNumber(pNumber);
        if (!result) {
            return result;
        } else {
            const imsQuery = ims.delete().where(ims.phone_number.equals(pNumber)).toQuery();
            await pool.query(imsQuery);
            logger.info(`[IMS SERVICE]: Deleted IMS record for number ${pNumber}`);
            return pNumber;
        }
    } catch (ex) {
        logger.error("[IMS SERVICE]: Delete IMS by phone number db query failed: ", ex);
        return Promise.reject(ex);
    }
}

exports.getIms = getIms;
exports.getImsByNumber = getImsByNumber;
exports.saveIms = saveIms;
exports.deleteIms = deleteIms;
exports.validatePhoneNumber = validatePhoneNumber;
exports.validateIMS = validateIMS;
