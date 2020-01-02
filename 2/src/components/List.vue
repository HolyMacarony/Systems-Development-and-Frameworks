<template>
	<div>
        <h2>Pet Hotel Database</h2>
        <Login/>
		<ul>
			<ListItem
				v-for="(item) in pets"
				v-bind:pet="item"
				v-bind:key="item.id"
				v-on:delete-pet="deletePet(item.id)"
				v-on:save-pet="savePet({index: item.id, name: $event})"
                v-on:create-pet="createPet($event)"
			/>
		</ul>
		<CreatePet
            v-on:pet-created="refetch"
        />
	</div>
</template>

<script>
import ListItem from './ListItem.vue'
import Login from './Login.vue'
import CreatePet from './CreatePet.vue'
import gql from 'graphql-tag'

export default {
    components: { ListItem, Login, CreatePet },
    methods: {
        refetch: function(){
            this.$apollo.queries.pets.refetch()
        },
        savePet: async function (pet) {
            await this.$apollo.mutate(
                {
                    mutation: gql`
                    mutation updatePet($id: ID!, $name: String){
                        updatePet(id:$id, name:$name){
                            id
                            name
                        }
                    }
                `,
                variables: {
                    id: pet.index,
                    name: pet.name
                }
                }
            )
            //this.pets[pet.index].name = pet.name;
        },
        deletePet: async function (index) {
            await this.$apollo.mutate({
                mutation: gql`
                mutation deletePet($id: ID!){
                    deletePet(id: $id){
                        id
                        name
                    }
                }
                `,
                variables: {
                    id: index
                }
            })
            this.$apollo.queries.pets.refetch()
            //this.pets.splice(index, 1);
        },
        getNextId: function () {
            return this.nextId++;
        }
    },
    created: function () {
        if (this.nextId === null) {
            this.nextId = this.pets.length + 1;
        }
    },
    apollo: {
        pets: {
            query: gql`
            query PetsQuery($owner: ID, $first: Int, $offset: Int){
                pets(owner: $owner, first: $first, offset: $offset){
                    id
                    name
                    owner{
                        id
                        name
                    }
                }
            }
            `,
            variables: {
                first: 25,
                offset: 0
            }
        }
    },
    data: function () {
        return {
            pets: [],
            nextId: null,
        }
    },
}
</script>

