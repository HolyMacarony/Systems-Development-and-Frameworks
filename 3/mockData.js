const {getNeo4jDriver} = require("./neo4j.js");
let owners
let pets

const getOwners= ()=> [
      {id: '1', name: 'Hans', password: "1234"},
      {id: '2', name: 'Hanna', password: "5678"},
	  {id: '3', name: 'Herbert', password: "8765"}
    ];

const getPets = ()=>[
      { id: '1', name: 'Foo', owner: owners[0],},
      { id: '2', name: 'Bar', owner: owners[1],},
      { id: '3', name: 'Baz', owner: owners[0],},
	  { id: '4', name: 'Baz', owner: owners[2],}
    ];

async function importDataToNeo4j(){
	const driver = getNeo4jDriver();
	const session = driver.session();
	
	owners = getOwners()
	pets = getPets()
	
	const personCreationQuery = `
		UNWIND $owners AS owner
		MERGE (n:Person:Owner {id: owner.id, name: owner.name, password: owner.password})
		RETURN n`
	
	let result = await session.run(personCreationQuery,
	{
		owners: getOwners()
	})
	//console.log(result);
	
	const petCreationQuery = `
		UNWIND $pets AS pet
		MATCH (p:Owner {id: pet.owner.id})
		MERGE (t:Pet {id: pet.id})
		SET t.name = pet.name
		MERGE (t)-[:IS_ASSIGNED_TO]->(p)
		RETURN t`
		
	result = await session.run(petCreationQuery,
	{
		pets: getPets()
	})
	//console.log(result);
	
	session.close()
}

async function cleanUpDataInNeo4j(){
	const driver = getNeo4jDriver()
	const session = driver.session()
	await session.run(`MATCH (n) DETACH DELETE n`)
	session.close()
}

module.exports = {importDataToNeo4j, cleanUpDataInNeo4j}