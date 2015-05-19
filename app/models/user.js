/**
 * Users Data Model
 */

var moment = require('moment'),
    crypto = require('crypto'),
    AWS = require('../other/instance_aws_sdk'),
    DOC = require('dynamodb-doc'),
    docClient = new DOC.DynamoDB();

var Users = {

    /**
     * Create or Update User
     */

    saveUser: function(user, callback) {
        var params = {
            TableName: 'servantpress_users',
            ReturnValues: 'NONE',
            Key: {
                servant_user_id: user.servant_user_id
            },
            UpdateExpression: 'SET #b = :full_name_val, #c = :nick_name_val, #d = :email_val, #e = :servant_access_token_val, #f = :servant_access_token_limited_val, #g = :servant_refresh_token_val, #h = :last_signed_in_val',
            ExpressionAttributeNames: {
                '#b': 'full_name',
                '#c': 'nick_name',
                '#d': 'email',
                '#e': 'servant_access_token',
                '#f': 'servant_access_token_limited',
                '#g': 'servant_refresh_token',
                '#h': 'last_signed_in'
            },
            ExpressionAttributeValues: {
                ':full_name_val': user.full_name,
                ':nick_name_val': user.nick_name,
                ':email_val': user.email,
                ':servant_access_token_val': user.servant_access_token,
                ':servant_access_token_limited_val': user.servant_access_token_limited,
                ':servant_refresh_token_val': user.servant_refresh_token,
                ':last_signed_in_val': user.last_signed_in
            }
        };

        // Save DynamoDB Document
        docClient.updateItem(params, function(error, response) {
            if (error) return callback(error, null);
            return callback(null, user);
        });
    },

    /**
     * Show User
     */

    showUser: function(servantUserID, callback) {

        var params = {};
        params.TableName = "servantpress_users";
        params.Key = {
            servant_user_id: servantUserID
        };

        // Load DynamoDB Document
        console.time('DynamoDB: ShowUser');
        docClient.getItem(params, function(error, response) {
            console.timeEnd('DynamoDB: ShowUser');
            return callback(error, response.Item);
        });
    },

    /**
     * Query Users
     */

    queryUsers: function() {

    }
};


module.exports = Users;