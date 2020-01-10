'use strict';

const Boom = require('@hapi/boom');
const Hoek = require('@hapi/hoek');
const Joi = require('@hapi/joi');
const crypto = require('crypto');
const qs = require('querystring');

const internals = {};

exports.plugin = {
  name: 'hapi-vkminiapps-auth',
  pkg: require('../package.json'),
  requirements: {
    hapi: '>=17.7.0'
  },

  register(server) {
    server.auth.scheme('vk-mini-app', internals.implementation)
  }
};


internals.implementation = function (server, options) {
  Hoek.assert(typeof options.clientSecret === 'string', Error('Missing VK client secret'));

  const settings = Hoek.clone(options);

  return {
    authenticate: async function (request, h) {
      const headers_schema = Joi.object({
        vk_user_id: Joi.number().integer(),
        vk_app_id: Joi.number().integer(),
        vk_is_app_user: Joi.number().valid(0, 1),
        vk_are_notifications_enabled: Joi.number().valid(0, 1),
        vk_language: Joi.string().valid('ru', 'uk', 'be', 'kz', 'en', 'es', 'fi', 'de', 'it'),
        vk_ref: Joi.string().valid('featuring_discover', 'featuring_menu', 'featuring_new', 'other'),
        vk_access_token_settings: Joi.string(),
        vk_group_id: Joi.number().integer(),
        vk_viewer_group_role: Joi.string().valid('none', 'member', 'moder', 'editor', 'admin'),
        vk_platform: Joi.string().valid('mobile_android', 'mobile_iphone', 'mobile_web', 'desktop_web', 'mobile_android_messenger', 'mobile_iphone_messenger'),
        vk_is_favorite: Joi.number().valid(0, 1),
        sign: Joi.string().required()
      })
        .pattern(/./, Joi.any());

      let startParams = headers_schema.validate(request.headers);

      if (startParams.error) {
        throw Boom.unauthorized('Headers validation error', 'vk-mini-app')
      }
      let ordered = {};
      Object.keys(startParams.value).sort().forEach(key => {
        if (key.slice(0, 3) === 'vk_') {
          ordered[key] = startParams.value[key];
        }
      });

      const stringParams = qs.stringify(ordered);
      const paramsHash = crypto
        .createHmac('sha256', settings.clientSecret)
        .update(stringParams)
        .digest()
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=$/, '');

      const isValid = paramsHash === startParams.value.sign;

      if (!isValid) {
        return h.unauthenticated(Boom.unauthorized('Sign is invalid', 'vk-mini-app'))
      }

      if (typeof settings.validate === 'function') {
        const result = settings.validate(ordered);
        if (result.isValid) {
          return h.authenticated({credentials: result.credentials})
        } else {
          return h.unauthenticated(Boom.unauthorized(result.error ? result.error : 'User validation error', 'vk-mini-app'))
        }
      } else {
        return h.authenticated({credentials: ordered})
      }
    }
  };
};
