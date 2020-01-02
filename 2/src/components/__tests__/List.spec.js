import { shallowMount } from '@vue/test-utils'
import List from '../List.vue'
import ListItem from '../ListItem.vue'

const factory = () => {
	return shallowMount(List)
}

describe('List', () => {
	const wrapper = factory();

	it('Renders a add pet button', () => {
		const addButton = wrapper.find(".add-button");
		expect(addButton.text()).toBe("Add pet");
	})

	it('Renders the correct number of list items', () => {
		const listItems = wrapper.findAll(ListItem);
		expect(listItems.length).toBe(3);
	})

	it('Add a pet after add button was clicked', () => {
		const addButton = wrapper.findAll(".add-button");
		addButton.trigger("click");
		const listItems = wrapper.findAll(ListItem);
		expect(listItems.length).toBe(4);
	})
})