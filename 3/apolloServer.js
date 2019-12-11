const getSchema = require("./apollo.js");
const {ApolloServer} = require('apollo-server');
const permissions = require('./permissions.js');
const { applyMiddleware } = require('graphql-middleware');
const getNeo4jDriver = require("./neo4j.js");

function getApolloServer(){
	const schema = getSchema();
	const schemaWithMiddleware = applyMiddleware(schema, permissions);
	const server = new ApolloServer(
	{
		schema: schemaWithMiddleware,
		context: ({req})=>{return {
			token: req.headers.authorization,
			driver: getNeo4jDriver()}}
	});
	return server;
}

function getTestApolloServer(context){
	const schema = getSchema();
	const schemaWithMiddleware = applyMiddleware(schema, permissions);
	const server = new ApolloServer({schema: schemaWithMiddleware, context: context});
	return server;
}

module.exports.getApolloServer = getApolloServer;
module.exports.getTestApolloServer = getTestApolloServer;
