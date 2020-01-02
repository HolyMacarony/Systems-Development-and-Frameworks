const {getApolloServer} = require('./apolloServer.js');
(async () =>{
	const apolloServer = await getApolloServer()
	apolloServer.listen().then(({url})=> {
	 console.log(`Apollo server running at: ${url}`);
	});	
})()


