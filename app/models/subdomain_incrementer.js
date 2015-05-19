/**
 * SubdomainIncrementer Data Model
 */

var moment = require('moment'),
    crypto = require('crypto'),
    AWS = require('../other/instance_aws_sdk'),
    DOC = require('dynamodb-doc'),
    docClient = new DOC.DynamoDB();

var SubdomainIncrementer = {

    /**
     * Update SubdomainIncrementer
     */

    increment: function(callback) {
        var params = {
            TableName: 'subdomain_incrementer',
            ReturnValues: 'ALL_NEW',
            Key: {
                service: 'servant_vendee'
            },
            UpdateExpression: 'SET #a = #a + :number_val',
            ExpressionAttributeNames: {
                '#a': 'number'
            },
            ExpressionAttributeValues: {
                ':number_val': 1
            }
        };

        // Save DynamoDB Document
        docClient.updateItem(params, function(error, response) {
            console.log(error)
            if (error) return callback(error, null);
            return callback(null, response);
        });
    }

};


module.exports = SubdomainIncrementer;