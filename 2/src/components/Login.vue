<template>
<div>
	<div v-if="!hasToken">
        <input placeholder="username" v-model="userName"/>
        <input placeholder="password" type="password" v-model="password"/>
		<button class="saveButton" v-on:click="login">login</button>
	</div>
	<button v-else class="saveButton" v-on:click="logout">logout {{loggedInUser}}</button>
</div>
</template>

<script>
import { onLogin, onLogout } from '../vue-apollo'
import gql from 'graphql-tag'
import jwt from 'jsonwebtoken'

export default{
	props : [],
	data: function (){
		return {
			userName: null,
			password: null,
			hasToken: false,
			loggedInUser: ""
		}
	},
	methods: {
		login: async function(){
			const token = await this.$apollo.mutate(
                {
                    mutation: gql`
					mutation login($userName: String!, $pwd: String!){
						login(userName: $userName, pwd: $pwd)
					}
					`,
					variables: {
						userName: this.userName,
						pwd: this.password
					}
                }
			)
			
			if(token.data.login){
				onLogin(this.$apollo.getClient(),token.data.login)
				//console.log(token.data)
				this.hasToken = true
				this.userName = ""
				this.password = ""
				this.loggedInUser = jwt.decode(token.data.login).userName
			}
		},
		logout: function(){
			onLogout(this.$apollo.getClient())
			this.hasToken = false
		}
	},
	created: function (){
		const token = localStorage.getItem('apollo-token')
		if(token){
			this.hasToken = true
			//console.log(jwt.decode(token))
			this.loggedInUser = jwt.decode(token).userName
		}else{
			this.hasToken = false
		}
	}
}
</script>