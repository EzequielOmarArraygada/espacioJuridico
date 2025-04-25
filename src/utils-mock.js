import { fakerES as faker } from '@faker-js/faker'

export const generateProducts = () => {
    try {
        return {
            id: faker.database.mongodbObjectId(),
            title: faker.commerce.productName(), 
            description: faker.commerce.productDescription(), 
            price: faker.commerce.price(), 
            thumbnail: faker.image.url(), 
            code: faker.string.alphanumeric(), 
            stock: faker.string.alphanumeric(), 
            category: faker.commerce.department(),
            status: faker.string.binary(),
        };
    } catch (error) {
        console.error(
            'Error al generar', error
        )
        throw error;
    }
}


