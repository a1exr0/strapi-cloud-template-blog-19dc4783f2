// Environment configuration
if (process.env.NODE_ENV === 'production') {
  // Load production environment configuration
  const { loadProductionEnv } = require('./load-production-env');
  loadProductionEnv();
} else {
  // Development environment
  require('dotenv').config();
}

class ForceCleanup {
  constructor() {
    this.baseUrl = process.env.PUBLIC_URL || 'http://localhost:1337';
    this.apiToken = process.env.STRAPI_API_TOKEN;
    
    // Add logging to show what endpoint and credentials we're using
    console.log('🔧 FORCE CLEANUP CONFIGURATION:');
    console.log(`   📡 Base URL: ${this.baseUrl}`);
    console.log(`   🔑 API Token: ${this.apiToken ? `${this.apiToken.substring(0, 10)}...${this.apiToken.substring(this.apiToken.length - 4)}` : 'NOT SET'}`);
    console.log(`   📊 Token Length: ${this.apiToken ? this.apiToken.length : 0} characters`);
    console.log('');
  }

  async performForceCleanup() {
    console.log('💪 Starting FORCE Cleanup of ALL Content...\n');

    try {
      // Use multiple approaches to ensure deletion
      await this.forceRemoveAllArticles();
      await this.forceRemoveAllKnowledgebase();
      await this.finalVerification();

      console.log('\n✅ Force cleanup completed!');

    } catch (error) {
      console.error('❌ Force cleanup failed:', error);
    }
  }

  async forceRemoveAllArticles() {
    console.log('=== FORCE REMOVING ALL ARTICLES ===\n');

    let attempts = 0;
    let remainingArticles = [];

    while (attempts < 3) {
      attempts++;
      console.log(`🔄 Attempt ${attempts}...`);

      try {
        const articles = await this.strapiRequest('GET', '/api/articles');
        
        if (!articles.data || articles.data.length === 0) {
          console.log('✅ No articles found');
          break;
        }

        console.log(`🗑️ Found ${articles.data.length} articles to remove`);
        remainingArticles = articles.data;

        for (const article of articles.data) {
          try {
            // Try both documentId and id approaches
            console.log(`  🎯 Removing: "${article.title}" (ID: ${article.id}, DocumentID: ${article.documentId})`);
            
            // Method 1: Using documentId
            try {
              await this.deleteRequest(`/api/articles/${article.documentId}`);
              console.log(`    ✅ Removed via documentId`);
              continue;
            } catch (error1) {
              console.log(`    ⚠️ DocumentId failed: ${error1.message}`);
            }

            // Method 2: Using numeric id
            try {
              await this.deleteRequest(`/api/articles/${article.id}`);
              console.log(`    ✅ Removed via ID`);
              continue;
            } catch (error2) {
              console.log(`    ❌ Both methods failed: ${error2.message}`);
            }

          } catch (error) {
            console.error(`    ❌ Complete failure for "${article.title}": ${error.message}`);
          }
        }

        // Wait a bit for database consistency
        await this.sleep(2000);

      } catch (error) {
        console.error(`Error in attempt ${attempts}:`, error.message);
      }
    }

    console.log('\n' + '-'.repeat(60) + '\n');
  }

  async forceRemoveAllKnowledgebase() {
    console.log('=== FORCE REMOVING ALL KNOWLEDGEBASE ===\n');

    let attempts = 0;

    while (attempts < 3) {
      attempts++;
      console.log(`🔄 Attempt ${attempts}...`);

      try {
        const knowledgebase = await this.strapiRequest('GET', '/api/knowledgebases');
        
        if (!knowledgebase.data || knowledgebase.data.length === 0) {
          console.log('✅ No knowledgebase entries found');
          break;
        }

        console.log(`🗑️ Found ${knowledgebase.data.length} knowledgebase entries to remove`);

        for (const kb of knowledgebase.data) {
          try {
            console.log(`  🎯 Removing: "${kb.title}" (ID: ${kb.id}, DocumentID: ${kb.documentId})`);
            
            // Method 1: Using documentId
            try {
              await this.deleteRequest(`/api/knowledgebases/${kb.documentId}`);
              console.log(`    ✅ Removed via documentId`);
              continue;
            } catch (error1) {
              console.log(`    ⚠️ DocumentId failed: ${error1.message}`);
            }

            // Method 2: Using numeric id
            try {
              await this.deleteRequest(`/api/knowledgebases/${kb.id}`);
              console.log(`    ✅ Removed via ID`);
              continue;
            } catch (error2) {
              console.log(`    ❌ Both methods failed: ${error2.message}`);
            }

          } catch (error) {
            console.error(`    ❌ Complete failure for "${kb.title}": ${error.message}`);
          }
        }

        // Wait a bit for database consistency
        await this.sleep(2000);

      } catch (error) {
        console.error(`Error in attempt ${attempts}:`, error.message);
      }
    }

    console.log('\n' + '-'.repeat(60) + '\n');
  }

  async finalVerification() {
    console.log('=== FINAL VERIFICATION ===\n');

    try {
      // Add cache busting parameter
      const timestamp = Date.now();
      const articles = await this.strapiRequest('GET', `/api/articles?_t=${timestamp}`);
      const knowledgebase = await this.strapiRequest('GET', `/api/knowledgebases?_t=${timestamp}`);

      console.log(`📰 Final articles count: ${articles.data?.length || 0}`);
      console.log(`📚 Final knowledgebase count: ${knowledgebase.data?.length || 0}`);

      if ((articles.data?.length || 0) === 0 && (knowledgebase.data?.length || 0) === 0) {
        console.log('\n🎉 SUCCESS: All content has been completely removed!');
        console.log('🔄 You can now refresh your admin panel and it should be empty.');
      } else {
        console.log('\n⚠️ Some content is still showing:');
        
        if (articles.data?.length > 0) {
          console.log(`\nRemaining articles (${articles.data.length}):`);
          articles.data.forEach((article, index) => {
            console.log(`  ${index + 1}. "${article.title}" (ID: ${article.id})`);
          });
        }
        
        if (knowledgebase.data?.length > 0) {
          console.log(`\nRemaining knowledgebase (${knowledgebase.data.length}):`);
          knowledgebase.data.forEach((kb, index) => {
            console.log(`  ${index + 1}. "${kb.title}" (ID: ${kb.id})`);
          });
        }

        console.log('\n💡 Suggestions if content still remains:');
        console.log('   1. Restart your Strapi server to clear internal cache');
        console.log('   2. Check the database directly for orphaned records');
        console.log('   3. Clear your browser cache and refresh admin panel');
      }

    } catch (error) {
      console.error('Error in final verification:', error.message);
    }

    console.log('\n' + '-'.repeat(60) + '\n');
  }

  async deleteRequest(endpoint) {
    const url = `${this.baseUrl}${endpoint}`;
    
    console.log(`🌐 Making DELETE request to: ${url}`);
    
    const options = {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      }
    };

    if (this.apiToken) {
      options.headers.Authorization = `Bearer ${this.apiToken}`;
      console.log(`🔐 Using Authorization header: Bearer ${this.apiToken.substring(0, 10)}...${this.apiToken.substring(this.apiToken.length - 4)}`);
    } else {
      console.log('⚠️ No API token found - DELETE request will be unauthorized!');
    }

    const response = await fetch(url, options);
    
    console.log(`📊 DELETE Response status: ${response.status} ${response.statusText}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ DELETE API Error Response: ${errorText}`);
      throw new Error(`${response.status}: ${errorText}`);
    }

    console.log(`✅ DELETE request successful`);
    return true;
  }

  async strapiRequest(method, endpoint, data = null) {
    const url = `${this.baseUrl}${endpoint}`;
    
    console.log(`🌐 Making ${method} request to: ${url}`);
    
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
      }
    };

    if (this.apiToken) {
      options.headers.Authorization = `Bearer ${this.apiToken}`;
      console.log(`🔐 Using Authorization header: Bearer ${this.apiToken.substring(0, 10)}...${this.apiToken.substring(this.apiToken.length - 4)}`);
    } else {
      console.log('⚠️ No API token found - requests will be unauthorized!');
    }

    if (data) {
      options.body = JSON.stringify(data);
    }

    const response = await fetch(url, options);
    
    console.log(`📊 Response status: ${response.status} ${response.statusText}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ API Error Response: ${errorText}`);
      throw new Error(`Strapi API error: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    console.log(`✅ Request successful`);
    return result;
  }

  async sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Main execution
async function main() {
  const cleanup = new ForceCleanup();
  await cleanup.performForceCleanup();
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = ForceCleanup; 