<template>
			<li>
				<div v-if="displayPet">
					{{ petString }}
					<button class="editButton" v-on:click="displayPet=false">Edit</button>
					<button class="deleteButton" v-on:click="$emit('delete-pet')">Delete</button>
				</div>
				<div v-else>
					<input placeholder="Enter pet" v-model="inputValue"/>
					<button class="saveButton" v-on:click="savePet">Save</button>
					<button class="cancelButton" v-on:click="displayPet=true">Cancel</button>
				</div>
			</li>
</template>

<script>
export default{
	props : ['pet'],
	data: function (){
		return {
			displayPet: !(this.pet.name === ""),
			inputValue: this.pet.name
		}
	},
	methods: {
		savePet: function(){
			if(this.pet.id !== null){
				this.$emit('save-pet', this.inputValue);
			}
			this.displayPet = true;
		}
	}, 
	computed: {
		petString: function(){
			return this.pet.id + ". " + this.pet.name + "; owner: " + this.pet.owner.name;
		}
	}
}
</script>