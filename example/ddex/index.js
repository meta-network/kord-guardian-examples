const {
  createVerifiedIdentityClaimObject,
  verifyIdentityClaim,
} = require('@kord.js/identity-claims')
const { json } = require('micro')
const microCors = require('micro-cors')

const ddexRegistry = require('./registry.json')

// configure CORS
const cors = microCors({ allowMethods: ['POST'] })

// set env variables in non-production environments
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config({ path: './test/fixtures/.env' })
}

module.exports = cors(async (req, res) => {
  try {
    // claim issuer
    const issuer = {
      id: process.env.KORD_ID,
      privateKey: process.env.PRIVATE_KEY,
    }

    // claim property
    const property = process.env.CLAIM_PROPERTY

    // parse request body
    const { address, claimHash, claimMessage, graph, signature, subject } = await json(req)

    // verify recovered address equals given address
    const isAddressVerified = verifyIdentityClaim(address, claimHash, signature)

    // verify DPID exists in the DDEX Registry
    const ddexRecord = ddexRegistry[claimMessage]

    // throw error for unverified claims
    if (!isAddressVerified || !ddexRecord) return {
      errors: [{
        message: 'Could not verify claim',
      }]
    }

    // generate a verified KORD Claim object
    const verifiedIdentityClaim = createVerifiedIdentityClaimObject(
      claimMessage,
      graph,
      issuer,
      property,
      subject
    )

    // return verified KORD Claim in response body
    return verifiedIdentityClaim
  } catch (e) {
    return {
      errors: [{
        message: e.message,
      }]
    }
  }
})
