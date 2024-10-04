const Recipe = require('../models/recipeModel');
const User = require('../models/userModel');

exports.createRecipe = async (req, res) => {
    const { title, ingredients, instructions } = req.body;

    try {
        const newRecipe = new Recipe({
            title,
            ingredients,
            instructions,
            user: req.user.id,
        });

        await newRecipe.save();
        const user = await User.findById(req.user.id);
        user.recipes.push(newRecipe._id);
        await user.save();

        res.status(201).json(newRecipe);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
};

exports.getUserRecipes = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).populate('recipes');
        res.json(user.recipes);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
};

// Update a recipe by ID
exports.updateRecipe = async (req, res) => {
    const { title, description, ingredients } = req.body;

    try {
        let recipe = await Recipe.findById(req.params.id);

        if (!recipe) {
            return res.status(404).json({ msg: 'Recipe not found' });
        }

        // Optionally, check if the recipe belongs to the logged-in user
        if (recipe.user.toString() !== req.user.id) {
            return res.status(401).json({ msg: 'Not authorized to update this recipe' });
        }

        // Update recipe fields
        recipe.title = title || recipe.title;
        recipe.description = description || recipe.description;
        recipe.ingredients = ingredients || recipe.ingredients;

        await recipe.save();

        res.json(recipe);
    } catch (error) {
        console.error(error);
        res.status(500).send('Server Error');
    }
};

// Function to search recipes by title
exports.searchRecipesByTitle = async (req, res) => {
    const { query } = req.query;

    // Log the received query for debugging
    console.log('Received search query:', query);

    // Check if the query parameter is provided
    if (!query) {
        return res.status(400).json({ msg: 'Search query is required' });
    }

    try {
        // Fetch recipes that match the title query
        const recipes = await Recipe.find({
            userId: req.user.id, // Ensure the user ID is correctly obtained
            title: { $regex: query, $options: 'i' } // Case-insensitive search
        });

        // Check if no recipes were found
        if (recipes.length === 0) {
            return res.status(404).json({ msg: 'No recipes found' });
        }

        // Send back the found recipes
        res.status(200).json(recipes);
    } catch (error) {
        // Log any errors to the console for debugging
        console.error('Error searching recipes:', error);
        res.status(500).json({ msg: 'Server error', error: error.message });
    }
};



