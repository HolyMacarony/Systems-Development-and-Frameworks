const { ApolloServer, gql} = require('apollo-server');
const { makeExecutableSchema } = require('graphql-tools');
const { neo4jgraphql, cypherMutation } = require('neo4j-graphql-js');
const jwt = require('jsonwebtoken');
const secret = require('./secret.js');

let assignees
let todos

// A schema is a collection of type definitions (hence "typeDefs")
// that together define the "shape" of queries that are executed against
// your data. @relation(name: "IS_ASSIGNED_TO", direction: "OUT")
const typeDefs = gql`
  # Comments in GraphQL strings (such as this one) start with the hash (#) symbol.

  type Todo {
    id: ID!
    message: String
    assignee: Assignee
  }

  type Assignee {
    id: ID!
    name: String!
	password: String!
  }

  type Query {
	todo(id: ID!): Todo
    todos(assignee: ID, first: Int, offset: Int, desc: Boolean): [Todo]
  }
  
  type Mutation{
	  login(userName: String!, pwd: String!): String! 
	  createTodo(message: String, assignee: ID!): Todo
	  updateTodo(id: ID!, message: String): Todo
	  deleteTodo(id: ID!): Todo
	  createAssignee(name: String!, password: String!): Assignee
	  updateAssignee(id: ID!, name: String!, password: String!): Assignee
  }
`;

const getAssignees= ()=> [
      {id: '1', name: 'Hans', password: "1234"},
      {id: '2', name: 'Hanna', password: "5678"}
    ];

const getTodos = ()=>[
      { id: '1', message: 'Foo', assignee: assignees[0],},
      { id: '2', message: 'Bar', assignee: assignees[1],},
      { id: '3', message: 'Baz', assignee: assignees[0],}
    ];

function getRandomId(){
	return Math.floor(Math.random() * Math.floor(9999999)).toString();
}	
	
const resolvers = {
  Query: {
	todo: (parent, args, context, info) => {
		return neo4jgraphql(parent, args, context, info)
	},
    todos: async(parent, args, context, info) => {
		const session = context.driver.session()
		let result
		if(args.assignee != null){
			let query = `
			MATCH (t:Todo)-[:IS_ASSIGNED_TO]->(p:Person {id: $assignee})
			RETURN t, p
			ORDER BY p.name
			SKIP $s
			LIMIT $l
			`
			if(args.desc == true){
				query = `
				MATCH (t:Todo)-[:IS_ASSIGNED_TO]->(p:Person {id: $assignee})
				RETURN t, p
				ORDER BY p.name DESC
				SKIP $s
				LIMIT $l
				`
			}
			result = await session.run(query,
			{
				assignee: args.assignee,
				s: args.offset,
				l: args.first
			})
		}else{
			let query = `
			MATCH (t:Todo)-[:IS_ASSIGNED_TO]->(p:Person)
			RETURN t, p
			ORDER BY p.name
			SKIP $s
			LIMIT $l
			`
			if(args.desc == true){
				query = `
				MATCH (t:Todo)-[:IS_ASSIGNED_TO]->(p:Person)
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

		session.close()
		return result.records.map((record) => {
			let response = {...record.get('t').properties, assignee: record.get('p').properties}
			return response;
		});
	},
  },
  Mutation: {
	  login: (parent, args, context, info) =>{
		  return jwt.sign({userName: args.userName}, secret, {expiresIn: "1 day"});
	  },
	  createTodo: async (parent, args, context, info) => {
		  const session = context.driver.session()
		  const result = await session.run(`
		  MATCH (p:Person) WHERE p.id = $assignee
		  CREATE (t:Todo {id: $id, message: $message})
		  MERGE (t)-[:IS_ASSIGNED_TO]->(p)
		  RETURN t, p
		  `,
		  {
			id: getRandomId(),
			message: args.message,
			assignee: args.assignee
		  }
		  )
		  session.close();
		  const record = result.records[0];
		  return {...record.get('t').properties, assignee: record.get('p').properties};
	  },
	  deleteTodo: (parent, args, context, info) =>{
		return neo4jgraphql(parent, args, context, info)
	  },
	  updateTodo: (parent, args, context, info) =>{
		  let result = neo4jgraphql(parent, args, context, info)
		  console.log(result)
		  return result
	  },
	  createAssignee: async (parent, args, context, info) => {
		  const session = context.driver.session()
		  const result = await session.run(`
		  CREATE (p:Person:Assignee {id: $id, name: $name, password: $password})
		  RETURN p
		  `,
		  {
			  id: getRandomId(),
			  name: args.name,
			  password: args.password
		  }
		  )
		  session.close();
		  return result.records[0].get('p').properties;
	  },
	  updateAssignee: async (parent, args, context, info) =>{
		  let result = cypherMutation(args, context, info)
		  console.log(result)
		  return neo4jgraphql(parent, args, context, info)
	  },
  }
};

function getSchema(){
	//reset the data each time the schema is returned
	assignees = getAssignees();
	todos = getTodos();
	return makeExecutableSchema({
		typeDefs: typeDefs,
		resolvers: resolvers
});
}

module.exports = getSchema;

