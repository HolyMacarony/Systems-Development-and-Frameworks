const { createTestClient } = require('apollo-server-testing');
const {gql} = require('apollo-server');
const {getTestApolloServer} = require('./apolloServer.js');
const {importDataToNeo4j, cleanUpDataInNeo4j} = require('./mockData.js');
const {closeDriver} = require("./neo4j.js");

const server = getTestApolloServer();
const initClient = createTestClient(server);

const loginMutation = gql`
	mutation login($userName: String!, $pwd: String!){
		login(userName: $userName, pwd: $pwd)
	}
`;

const createPetMutation = gql`
	mutation createPet($name: String, $owner: ID!){
		createPet(name: $name, owner: $owner){
			name
			owner{
				name
			}
		}
	}
`;

const createOwnerMutation = gql`
	mutation createOwner($name: String!, $password: String!){
		createOwner(name: $name, password: $password){
			name
		}
	}
`;

const updatePetMutation = gql`
	mutation updatePet($id: ID!, $name: String){
		updatePet(id:$id, name:$name){
			id
			name
		}
	}
`;

const getPetQuery = gql`
	query getPet($id: ID!){
		pet(id: $id){
			id
			name
		}
	}
`;

const deletePetMutation = gql`
	mutation deletePet($id: ID!){
		deletePet(id: $id){
			id
			name
		}
	}
`;

	
const petsQuery = gql`
	query PetsQuery($owner: ID, $first: Int, $offset: Int){
		pets(owner: $owner, first: $first, offset: $offset){
			id
			name
			owner{
				name
			}
		}
	}
`;

const ownersQuery = gql`
	query{
		owners{
			id
			name
		}
	}
`


beforeAll(async()=>{
	await cleanUpDataInNeo4j()
})

afterAll(async()=>{
	await closeDriver()
})

describe('User is logged in', ()=>{
	let query
	let mutate
	beforeEach(async()=>{
		await importDataToNeo4j()
		const result = await initClient.mutate({
			mutation: loginMutation,
			variables: {userName: "Hans", pwd: "1234"}
		})
		
		const testServer = getTestApolloServer({token: result.data.login});
		const testClient = createTestClient(testServer);
		//console.log(result);
		query = testClient.query;
		mutate = testClient.mutate;
	});
	afterEach(async()=>{
		await cleanUpDataInNeo4j()
	})
	
	it('creates a new pet', async ()=>{	
		const result = await mutate({
				mutation: createPetMutation,
				variables: {name: "The new name", owner: '1'}
		});
		console.log(result);
		expect(result.data).toMatchObject({
			"createPet":{
				name: "The new name",
				owner: {
					name: "Hans"
				}
			}
		});
	});

	it('updates a pet', async ()=>{
		const result = await mutate(
		{
			mutation: updatePetMutation,
			variables: {id: "2", name: "color me surprised"}
		}
		);
		console.log(result);
		expect(result.data).toMatchObject({
			updatePet:
			{
				id: "2",
				name: "color me surprised"
			}
		});
	})
	
	it('deletes a pet', async () => {
		const queryResult = await query({
			query: petsQuery,
			variables: {
				first: 10,
				offset: 0
			}
		});
		
		let expectedPet = queryResult.data.pets[queryResult.data.pets.length -1];
		
		const result = await mutate({
			mutation: deletePetMutation,
			variables: {id: expectedPet.id}
		});
		
		const emptyResult = await query(
		{
			query: getPetQuery,
			variables: {id: expectedPet.id}
		}
		);
		
		console.log(result);
		console.log(expectedPet);
		expect(result.data.deletePet.id).toBe(expectedPet.id);
		expect(emptyResult.data.pet).toBeFalsy;
	})

	it('adds an owner', async ()=>{
		const result = await mutate({
			mutation: createOwnerMutation,
			variables: {name: "Helga", password: "1337"}
		});
		console.log(result);
		expect(result.data).toMatchObject({
			createOwner:{
				name: "Helga"
			}
		});
	})
});

describe('User is not logged in', ()=>{
	let query
	let mutate
	beforeEach(async ()=>{
		await importDataToNeo4j()
		const testServer = getTestApolloServer(()=>{return {token: ""}});
		const testClient = createTestClient(testServer);
		//console.log(result);
		query = testClient.query;
		mutate = testClient.mutate;
	})
	afterEach(async()=>{
		await cleanUpDataInNeo4j()
	})
	
	it('gets all pets', async ()=>{
		const result = await query({
			query: petsQuery,
			variables: {
				first: 10,
				offset: 0
			}
		});
		expect(result.data.pets.length).toBe(4);
	});
	
	it('gets all pets with pagination', async ()=>{
		const result = await query({
			query: petsQuery,
			variables: {
				first: 2,
				offset: 1
			}
		});
		expect(result.data.pets.length).toBe(2);
	});

	it('gets a single pet', async ()=>{
		const result = await query(
		{
			query: getPetQuery,
			variables: {id: "2"}
		}
		);
		expect(result.data.pet.name).toBe("Bar");
	})
	
	it('gets all pets with owner 1', async ()=>{
		const result = await query({
			query: petsQuery,
			variables: {
				owner: "1",
				first: 10,
				offset: 0
			}
		});
		expect(result.data.pets.length).toBe(2);
	});

	it('gets all possible owners', async ()=>{
		const result = await query({
			query: ownersQuery
		})

		expect(result.data.owners.length).toBe(3)
		expect(result.data.owners.map((owner)=>owner.name)).toContain('Hanna')
	})
	
	it('cannot create a new pet', async ()=>{	
		const result = await mutate({
				mutation: createPetMutation,
				variables: {name: "The new name", owner: '1'}
		});
		//console.log(result);
		expect(result.error).not.toBe(null);
	});
});





