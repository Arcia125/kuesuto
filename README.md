# Kuesuto: Chronicles of the Elven Blade
![project-kuesuto](https://github.com/user-attachments/assets/7cab0014-9282-4558-9d07-ff85064b4cd4)

[Demo](https://arcia125.github.io/kuesuto/)

Kuesuto is a passion project and homage to *The Legend of Zelda: A Link to the Past*, combining classic action RPG elements with handcrafted pixel art and a meticulously designed world. Developed entirely in TypeScript, this project showcases custom game mechanics, intricate AI, and an immersive storyline set in a beautifully pixelated world.

---

### Game Overview

Kuesuto transports players to the enchanted forests of Verdelight, where a slow, spreading **corruption** is twisting the creatures of the woods into something darker. The player is **Arcia**, a silver-haired elf and sword-first fighter, who is drawn into uncovering *why* — its source is a mystery, not a prophecy. Along the way she meets figures like **Morghal**, a robed wizard who has watched the forest far too long and offers direction and unsettled questions rather than easy answers. See [DESIGN.md](./DESIGN.md) for the full canon.

---

### Technical Highlights

Kuesuto's development involved creating an entirely custom game engine in TypeScript, including a unique pathfinding library called **[Pather](https://www.npmjs.com/package/@arcia125/pather)**, which has been open-sourced for other developers. This pathfinding system enables enemies to track and pursue the player with precision, adding a challenging dynamic to combat encounters. The map design was created in *Tiled*, a popular tool for building pixel art maps, allowing for a rich and cohesive game environment.

**Key Features:**

* **Handcrafted Pixel Art**: Custom, retro-inspired visuals that add to the game's nostalgic feel.
* **Responsive Controls**: Movement uses **WASD** or arrow keys, with a custom on-screen controller for mobile.
* **Real-Time Action Combat**: Engage enemies in close combat, leveling up as you gain experience.
* **Advanced Enemy AI**: Enemies use the Pather library to track the player’s movements, increasing difficulty and realism.
* **Dynamic Storyline**: Interact with NPCs like Morghal, who offer guidance and reveal the lore of Verdelight.

---

### Meet Morghal

Morghal, a robed figure who has watched the forest "longer than he cares to remember," serves as a guide to the player — one who asks questions rather than pronouncing fate. When Arcia first wanders into the glade, he greets her plainly:

> **Morghal**: "Hmm. A traveler. It has been some time since anyone wandered into Verdelight Glade."

> The wizard studies you with calm, steady eyes. "Something is wrong here. The creatures of the glade are changing — a corruption is taking hold, twisting them into something darker. I could use your help."

With each interaction, Morghal reveals a little more — but the source of the corruption stays a genuine mystery, for him as much as for Arcia. The game is the uncovering.

---

### Playing Kuesuto

Whether exploring the intricacies of Verdelight, engaging in battles, or strategizing against enemy AI, Kuesuto aims to bring players into a classic adventure setting with a fresh twist. Its technical depth, handcrafted visuals, and original story elements make it a rewarding experience for fans of classic action RPGs.

### Try It Out

Kuesuto was built for those who love a challenging, nostalgic RPG with real-time combat. Join the adventure and see if you have what it takes to restore balance to Verdelight!

---

**Further Exploration**:
* *[Pathfinding Library: Pather on GitHub](https://github.com/Arcia125/pather)* - Explore and utilize the Pather library, designed to simplify pathfinding in 2D games.
