const express = require('express');
const router = express.Router();
const Cart = require('../models/Cart');

// Add to Cart
router.post('/cart', async (req, res) => {
    const { userId, sessionId, items } = req.body;

    try {
        let cart;
        if (userId) {
            cart = await Cart.findOne({ userId });
        } else if (sessionId) {
            cart = await Cart.findOne({ sessionId });
        }

        if (!cart) {
            // Create a new cart if it does not exist
            cart = new Cart({ userId, sessionId, items });
        } else {
            // Update the cart with new items
            items.forEach(item => {
                const existingItem = cart.items.find(i => i.productId.toString() === item.productId.toString());

                if (existingItem) {
                    // Update quantity if the item already exists in the cart
                    existingItem.quantity += item.quantity;
                } else {
                    // Add new item if it does not exist in the cart
                    cart.items.push(item);
                }
            });
        }

        await cart.save();
        res.status(201).json(cart);
    } catch (error) {
        console.error('Failed to add items to cart:', error);
        res.status(500).json({ error: 'Failed to add items to cart' });
    }
});

// Remove from Cart
router.delete('/cart/:cartItemId', async (req, res) => {
    const { cartItemId } = req.params;
    const { userId, sessionId } = req.query;

    try {
        let cart;
        if (userId) {
            cart = await Cart.findOneAndUpdate(
                { userId, 'items._id': cartItemId },
                { $pull: { items: { _id: cartItemId } } },
                { new: true }
            );
        } else if (sessionId) {
            cart = await Cart.findOneAndUpdate(
                { sessionId, 'items._id': cartItemId },
                { $pull: { items: { _id: cartItemId } } },
                { new: true }
            );
        }

        if (!cart) {
            return res.status(404).json({ error: 'Cart item not found' });
        }

        res.status(200).json(cart);
    } catch (error) {
        console.error('Failed to remove item from cart:', error);
        res.status(500).json({ error: 'Failed to remove item from cart' });
    }
});

// Get Cart Items
router.get('/cart', async (req, res) => {
    const { userId, sessionId } = req.query;

    try {
        let cart;
        if (userId) {
            cart = await Cart.findOne({ userId }).populate('items.productId');
        } else if (sessionId) {
            cart = await Cart.findOne({ sessionId }).populate('items.productId');
        } else {
            return res.status(400).json({ error: 'User ID or Session ID required' });
        }

        if (!cart) {
            return res.status(200).json({ items: [] });
        }

        res.status(200).json({ items: cart.items });
    } catch (error) {
        console.error('Error fetching cart items:', error);
        res.status(500).json({ error: 'Failed to retrieve cart items' });
    }
});

// Update quantity in Cart
// Update quantity in Cart
router.put('/cart/:cartItemId/quantity', async (req, res) => {
    const { cartItemId } = req.params;
    const { userId, sessionId } = req.query;
    const { quantity } = req.body;

    try {
        if (quantity < 1) {
            return res.status(400).json({ error: 'Quantity must be at least 1' });
        }

        let cart;
        if (userId) {
            cart = await Cart.findOne({ userId, 'items._id': cartItemId });
        } else if (sessionId) {
            cart = await Cart.findOne({ sessionId, 'items._id': cartItemId });
        }

        if (!cart) {
            return res.status(404).json({ error: 'Cart not found' });
        }

        const item = cart.items.id(cartItemId);
        if (!item) {
            return res.status(404).json({ error: 'Item not found in cart' });
        }

        item.quantity = quantity; // Set the new quantity

        await cart.save();
        res.status(200).json({ items: cart.items });
    } catch (error) {
        console.error('Failed to update quantity in cart:', error);
        res.status(500).json({ error: 'Failed to update quantity in cart' });
    }
});


module.exports = router;
