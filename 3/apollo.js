const { ApolloServer, gql} = require('apollo-server');
const { makeExecutableSchema } = require('graphql-tools');
const { neo4jgraphql, cypherMutation } = require('neo4j-graphql-js');
const jwt = require('jsonwebtoken');
const secret = require('./secret.js');

// A schema is a collection of type definitions (hence "typeDefs")
// that together define the "shape" of queries that are executed against
// your data. @relation(name: "IS_ASSIGNED_TO", direction: "OUT")
const typeDefs = gql`
  # Comments in GraphQL strings (such as this one) start with the hash (#) symbol.

  type Pet {
    id: ID!
    name: String
    owner: Owner
  }

  type Owner {
    id: ID!
    name: String!
	password: String!
  }

  type Query {
	pet(id: ID!): Pet
	pets(owner: ID, first: Int, offset: Int, desc: Boolean): [Pet]
	owners: [Owner]
  }
  
  type Mutation{
	  login(userName: String!, pwd: String!): String! 
	  createPet(name: String, owner: ID!): Pet
	  updatePet(id: ID!, name: String): Pet
	  deletePet(id: ID!): Pet
	  createOwner(name: String!, password: String!): Owner
	  updateOwner(id: ID!, name: String!, password: String!): Owner
  }
`;

function getRandomId(){
	return Math.floor(Math.random() * Math.floor(9999999)).toString();
}	
	
const resolvers = {
  Query: {
	owners: (parent, args, context, info) =>{
		return neo4jgraphql(parent, args, context, info)
	},
	pet: (parent, args, context, info) => {
		return neo4jgraphql(parent, args, context, info)
	},
    pets: async(parent, args, context, info) => {
		const session = context.driver.session()
		let result
		let query
		try{
			if(args.owner != null){
				query = `
				MATCH (t:Pet)-[:IS_ASSIGNED_TO]->(p:Person {id: $owner})
				RETURN t, p
				ORDER BY p.name
				SKIP $s
				LIMIT $l
				`
				if(args.desc == true){
					query = `
					MATCH (t:Pet)-[:IS_ASSIGNED_TO]->(p:Person {id: $owner})
					RETURN t, p
					ORDER BY p.name DESC
					SKIP $s
					LIMIT $l
					`
				}
				result = await session.run(query,
					{
						owner: args.owner,
						s: args.offset,
						l: args.first
					})
			}else{
				query = `
				MATCH (t:Pet)-[:IS_ASSIGNED_TO]->(p:Person)
				RETURN t, p
				ORDER BY p.name
				SKIP $s
				LIMIT $l
				`
				if(args.desc == true){
					query = `
					MATCH (t:Pet)-[:IS_ASSIGNED_TO]->(p:Person)
					RETURN t, p
					ORDER BY p.name DESC
					SKIP $s
					LIMIT $l
					`
				}
				result = await session.run(query,
				{
					s: args.offset,
					l: args.first
				})			
			}
		}catch(e){
			console.log(e)
		}finally{
			session.close()
		}

		return result.records.map((record) => {
			let response = {...record.get('t').properties, owner: record.get('p').properties}
			return response;
		});
	},
  },
  Mutation: {
	  login: async(parent, args, context, info) =>{
		  const session = context.driver.session()
		  const result = await session.run(`
			  MATCH (p:Person {name: $name, password: $password})
			  RETURN p
			  `,
		  {
			name: args.userName,
			password: args.pwd
		  }
		  )
		  const record = result.records[0];
		  if(record){
			return jwt.sign({userName: args.userName, }, secret, {expiresIn: "1 day"});
		  }else{
			throw new Error("Incorrect username or password")
		  }
	  },
	  createPet: async (parent, args, context, info) => {
		  const session = context.driver.session()
		  let result
		  try{
		  result = await session.run(`
		  MATCH (p:Person) WHERE p.id = $owner
		  CREATE (t:Pet {id: $id, name: $name})
		  MERGE (t)-[:IS_ASSIGNED_TO]->(p)
		  RETURN t, p
		  `,
		  {
			id: getRandomId(),
			name: args.name,
			owner: args.owner
		  }
		  )
		}catch(e){
			console.log(e)
		}finally{
			session.close();
		}
		  const record = result.records[0];
		  return {...record.get('t').properties, owner: record.get('p').properties};
	  },
	  deletePet: (parent, args, context, info) =>{
		return neo4jgraphql(parent, args, context, info)
	  },
	  updatePet: (parent, args, context, info) =>{
		  return neo4jgraphql(parent, args, context, info)
	  },
	  createOwner: async (parent, args, context, info) => {
		  const session = context.driver.session()
		  let result
		  try{
			  result = await session.run(`
			  CREATE (p:Person:Owner {id: $id, name: $name, password: $password})
			  RETURN p
			  `,
			  {
				  id: getRandomId(),
				  name: args.name,
				  password: args.password
			  }
			  )
		  }catch(e){
			  console.log(e)
		  }finally{
			  session.close();
		  }
		  return result.records[0].get('p').properties;
	  },
	  updateOwner: (parent, args, context, info) =>{
		  return neo4jgraphql(parent, args, context, info)
	  },
  }
};

function getSchema(){
	return makeExecutableSchema({
		typeDefs: typeDefs,
		resolvers: resolvers
});
}

module.exports = getSchema;

