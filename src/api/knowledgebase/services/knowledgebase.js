'use strict';

/**
 * knowledgebase service
 */

const { createCoreService } = require('@strapi/strapi').factories;

module.exports = createCoreService('api::knowledgebase.knowledgebase');
