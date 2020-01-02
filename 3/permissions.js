//import { rule, and, or, not, shield } from 'graphql-shield'
const { rule, and, or, not, shield } = require('graphql-shield');
const jwt = require('jsonwebtoken');
const secret = require('./secret.js');

const isAuthenticated = rule()(async (parent, args, ctx, info) => {
  var valid = false;
  try{
	  let token = ctx.token
	  if(token && token.startsWith('Bearer ')){
		  token = token.slice(7, token.length).trimLeft();
	  }
	  var payload = jwt.verify(token, secret);
	  valid = payload != null;
  }
  catch(err){
	  console.log(err);
  }
  return valid;
})

const permissions = shield({
  Mutation: {
	createPet: isAuthenticated,
	updatePet: isAuthenticated,
	deletePet: isAuthenticated,
	updateOwner: isAuthenticated
  },
})

module.exports = permissions;
