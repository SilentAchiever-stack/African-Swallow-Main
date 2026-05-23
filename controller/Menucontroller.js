const MenuItem = require('../Model/menuitem');


// GET /api/menu  — public, returns all available items
const getAllMenuItems = async (req, res) => {
    try {
        const { category } = req.query;

        const filter = { available: true };
        if (category && category !== 'all') {
            filter.category = category.toLowerCase();
        }

        const items = await MenuItem.find(filter).sort({ category: 1, createdAt: -1 });

        return res.status(200).json({
            success: true,
            count: items.length,
            data: items
        });

    } catch (error) {
        console.error('Fetch menu error:', error);
        return res.status(500).json({ success: false, message: 'Something went wrong.' });
    }
};

// GET /api/menu/admin  — admin only, returns ALL items including unavailable
const getAllMenuItemsAdmin = async (req, res) => {
    try {
        const items = await MenuItem.find().sort({ category: 1, createdAt: -1 });
        return res.status(200).json({ success: true, count: items.length, data: items });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Something went wrong.' });
    }
};

// POST /api/menu  — admin only, add new item
const createMenuItem = async (req, res) => {
    try {
        const { name, category, price, description, image, popular } = req.body;

        if (!name || !category || !price || !description || !image) {
            return res.status(400).json({
                success: false,
                message: 'name, category, price, description, and image are all required.'
            });
        }

        const item = await MenuItem.create({
            name, category, price, description, image,
            popular: popular || false
        });

        return res.status(201).json({
            success: true,
            message: 'Menu item created.',
            data: item
        });

    } catch (error) {
        console.error('Create menu item error:', error);
        return res.status(500).json({ success: false, message: 'Something went wrong.' });
    }
};

// PATCH /api/menu/:id  — admin only, update any field
const updateMenuItem = async (req, res) => {
    try {
        const item = await MenuItem.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );

        if (!item) {
            return res.status(404).json({ success: false, message: 'Menu item not found.' });
        }

        return res.status(200).json({
            success: true,
            message: 'Menu item updated.',
            data: item
        });

    } catch (error) {
        console.error('Update menu item error:', error);
        return res.status(500).json({ success: false, message: 'Something went wrong.' });
    }
};

// DELETE /api/menu/:id  — superAdmin only
const deleteMenuItem = async (req, res) => {
    try {
        const item = await MenuItem.findByIdAndDelete(req.params.id);

        if (!item) {
            return res.status(404).json({ success: false, message: 'Menu item not found.' });
        }

        return res.status(200).json({
            success: true,
            message: `"${item.name}" deleted from menu.`
        });

    } catch (error) {
        console.error('Delete menu item error:', error);
        return res.status(500).json({ success: false, message: 'Something went wrong.' });
    }
};

// POST /api/menu/seed  — one-time seed of all 20 original menu items
const seedMenu = async (req, res) => {
    try {
        const existing = await MenuItem.countDocuments();
        if (existing > 0) {
            return res.status(400).json({
                success: false,
                message: `Menu already has ${existing} items. Clear it first if you want to re-seed.`
            });
        }

        const menuItems = [
            { id: 1, name: "Jollof Rice", category: "rice", price: 2500, description: "The crown jewel of West African cuisine. Perfectly seasoned rice cooked in rich tomato sauce with aromatic spices.", image: "https://i.pinimg.com/1200x/e3/d4/e9/e3d4e9461a93889cd0224b0387b3e9cb.jpg", popular: true },
            { id: 2, name: "Fried Rice", category: "rice", price: 2800, description: "Colorful mixed rice with vegetables, chicken, and prawns. A delightful fusion of flavors and textures.", image: "https://i.pinimg.com/736x/3c/1e/ac/3c1eac3384402a669fc7c7c769132712.jpg", popular: false },
            { id: 3, name: "Coconut Rice", category: "rice", price: 2200, description: "Fragrant rice cooked in rich coconut milk with subtle spices. A creamy and aromatic delight.", image: "https://i.pinimg.com/1200x/77/ac/ec/77acec5a999fe6a5baa90bc54ca544e8.jpg", popular: false },
            { id: 4, name: "Ofada Rice", category: "rice", price: 3000, description: "Local Nigerian rice served with spicy ofada sauce. An authentic taste of tradition.", image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS2J99EC0RBHY-WxKxDKGiPH2DwBjegc4rSHA&s", popular: false },
            { id: 5, name: "Pounded Yam", category: "swallow", price: 2500, description: "Smooth, stretchy perfection made from fresh yam. The ultimate comfort food served with your choice of soup.", image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQaOD_PHNa9sVktSnfmiGhNF0_Ual93JfDKhg&s", popular: true },
            { id: 6, name: "Amala", category: "swallow", price: 2000, description: "Traditional Yoruba delicacy made from yam flour. Dark, smooth, and incredibly satisfying.", image: "https://i.pinimg.com/1200x/01/e3/bd/01e3bddec2ef693e3ef996b92abef817.jpg", popular: true },
            { id: 7, name: "Eba (Garri)", category: "swallow", price: 1200, description: "Classic Nigerian staple made from cassava flour. Simple, filling, and perfect with any soup.", image: "https://i.pinimg.com/736x/2e/5f/42/2e5f425614604166648b365b6a80508e.jpg", popular: false },
            { id: 8, name: "Fufu", category: "swallow", price: 1600, description: "Soft and stretchy made from cassava and plantain. A beloved West African staple.", image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTxcZHznfr226YVRP6c22dP0S3nZ0cfeM_o_Q&s", popular: false },
            { id: 9, name: "Wheat", category: "swallow", price: 2000, description: "Light and fluffy swallow made from wheat flour. A healthier alternative that's equally delicious.", image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR5MeLNBDllHY9RVkqRRC1erCSS02rRpvt_VQ&s", popular: false },
            { id: 10, name: "Egusi Soup", category: "soup", price: 3500, description: "Rich melon seed soup with assorted meat, fish, and vegetables. A Nigerian classic that's hearty and flavorful.", image: "https://i.pinimg.com/1200x/fb/61/02/fb6102f6d78e91574759bef766adb36e.jpg", popular: true },
            { id: 11, name: "Ewedu Soup", category: "soup", price: 1800, description: "Smooth jute leaf soup traditionally served with amala. Light, nutritious, and incredibly tasty.", image: "https://i.ytimg.com/vi/Xclxoyn-I74/hq720.jpg", popular: true },
            { id: 12, name: "Okra Soup", category: "soup", price: 2200, description: "Thick, hearty soup made with fresh okra, assorted meat, and seafood. Comfort in a bowl.", image: "https://i.pinimg.com/1200x/31/af/77/31af7766796ad1d84baca6e115d653b7.jpg", popular: false },
            { id: 13, name: "Bitter Leaf Soup", category: "soup", price: 3000, description: "Traditional soup made with bitter leaf vegetables, palm nut, and assorted protein. Rich and medicinal.", image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRHCsazVMlcSMzVzZWJvatxR2bzOkJZNW2x9Q&s", popular: false },
            { id: 14, name: "Pepper Soup", category: "soup", price: 4000, description: "Spicy, aromatic soup with goat meat or fish. Perfect for cold days and special occasions.", image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTJJ88UrNyOBTZ53Npuzs-hIBQtKxXCcAw9mQ&s", popular: false },
            { id: 15, name: "Vegetable Soup", category: "soup", price: 3000, description: "Nutritious soup packed with fresh vegetables, palm oil, and your choice of protein.", image: "https://i.pinimg.com/1200x/fb/61/02/fb6102f6d78e91574759bef766adb36e.jpg", popular: false },
            { id: 16, name: "Plantain (Dodo)", category: "sides", price: 800, description: "Sweet fried plantain slices. The perfect side dish that complements any meal.", image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRlK8bzrKoQbxzCpMKX7QCgS9zOXZLXLxWmxA&s", popular: true },
            { id: 17, name: "Moi Moi", category: "sides", price: 1000, description: "Steamed bean pudding with eggs, fish, and spices. A protein-rich delicacy wrapped in leaves.", image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSSxX7vTUdeXj-JiPSav22nf8fFvW02F1_l2g&s", popular: false },
            { id: 18, name: "Akara", category: "sides", price: 500, description: "Deep-fried bean cakes that are crispy outside and soft inside. Perfect breakfast or snack.", image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS0V07Yuedssx0UGgj9wk2Qz5vMal6GU1fo8w&s", popular: false },
            { id: 19, name: "Yam Porridge", category: "sides", price: 1700, description: "Hearty yam cooked with vegetables, palm oil, and spices. A complete meal in itself.", image: "https://cdn.tasteatlas.com/images/dishes/517d5a36d38749cf8e6119d3ddfa80ad.jpg?w=600", popular: false },
            { id: 20, name: "Beans Porridge", category: "sides", price: 1800, description: "Nutritious beans cooked with plantain, palm oil, and aromatic spices.", image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQJmZnriPgTY1RinA_enZqX7DyR0jIac-HuPA&s", popular: false }
        ];

        // Remove the old numeric id field — MongoDB will assign _id
        const cleanItems = menuItems.map(({ id, ...rest }) => rest);
        await MenuItem.insertMany(cleanItems);

        return res.status(201).json({
            success: true,
            message: `${cleanItems.length} menu items seeded successfully.`
        });

    } catch (error) {
        console.error('Seed menu error:', error);
        return res.status(500).json({ success: false, message: 'Failed to seed menu.' });
    }
};

module.exports = {
    getAllMenuItems,
    getAllMenuItemsAdmin,
    createMenuItem,
    updateMenuItem,
    deleteMenuItem,
    seedMenu
};