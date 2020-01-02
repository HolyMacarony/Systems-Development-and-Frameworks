<template>
	<div>
        <input placeholder="name" v-model="name"/>
        <select v-model="owner">
            <option disabled value="">owner</option>
            <option v-for="(person) in owners" v-bind:key="person.id" v-bind:value="person.id">
                {{ person.name }}
            </option>
        </select>
		<button class="saveButton" v-on:click="createPet">create pet</button>
	</div>
</template>

<script>
import gql from 'graphql-tag'

export default{
	props : [],
	data: function (){
		return {
			name: "",
			owner: ""
		}
	},
	methods: {
		createPet: async function (){
            if(!this.name || !this.owner){
                return
            }
            await this.$apollo.mutate({
                mutation:gql`
                mutation createPet($name: String, $owner: ID!){
                    createPet(name: $name, owner: $owner){
                        name
                        owner{
                            name
                        }
                    }
                }
                `,
                variables:{
                    name: this.name,
                    owner: this.owner
                }
            })
            this.$emit('pet-created');
            this.name = ""
            this.owner = ""
            //this.$apollo.queries.pets.refetch()
        }
    },
    apollo: {
        owners: {
            query: gql`{
                owners{
                    id
                    name
                }
            }
            `
        }
    }
}
</script>