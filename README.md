
# 🏎️ Neon Turbo Racer

**Neon Turbo Racer** is a high-octane, retro-futuristic 2D top-down racing game. Built for speed and precision, it challenges players to navigate through intense traffic, dodge deadly obstacles, and outrun the law across 5 increasingly difficult levels to become a racing legend.

![Game Preview](https://img.shields.io/badge/Status-Playable-brightgreen)
![Tech](https://img.shields.io/badge/Tech-React%2019%20%2B%20Vite-blue)
![Platform](https://img.shields.io/badge/Platform-Web%20%2F%20Mobile-orange)

---

## 🚀 How to Play

1.  **Enter your Driver ID**: Start by typing your name in the main menu to join the Hall of Fame.
2.  **Survive the Clock**: Each level lasts **30 seconds**. Your goal is to reach the end of the timer without losing all your lives.
3.  **Dodge & Weave**: Avoid NPC cars and road obstacles. Every collision costs a life!
4.  **Watch for Hazards**: 
    - **Oil Spills**: Driving over oil will cause your car to lose grip and **skid** uncontrollably for a short duration.
    - **Police Units**: Starting at Level 3, sequential police units will attempt to intercept you. Look for the "Incoming" warning and listen for the siren!
5.  **Master the Near Miss**: Pass NPC cars closely to earn a **+500 Near Miss Bonus**. Higher risks lead to higher scores.
6.  **Collect Power-ups**: Grab the **Glowing Stars** to gain temporary invincibility and a massive score boost.

---

## 🕹️ Controls

The game is fully responsive and supports both Desktop and Mobile devices.

### 💻 Desktop (Keyboard)
| Key | Action |
| :--- | :--- |
| `↑` or `W` | Accelerate Forward |
| `↓` or `S` | Brake / Reverse |
| `←` or `A` | Steer Left |
| `→` or `D` | Steer Right |

### 📱 Mobile (Touch)
*   **On-screen D-Pad**: Use the directional buttons at the bottom of the screen.
*   **Layout**: Left/Right steering on the left side, Up/Down on the right for a console-like experience.

---

## ✨ Advanced Features

-   **Police Pursuit AI**: Police cars feature dynamic weaving logic and enter the track one-by-one with dedicated HUD warnings and modulated sirens.
-   **Realistic Drifting Physics**: Hit an oil spill to experience a loss of steering control, accompanied by a multi-layered tire screeching sound effect.
-   **5 Thematic Levels**:
    - **Level 1-4**: Evolving neon palettes from "Cyber Blue" to "Pulse Orange".
    - **Level 5 (The Void)**: A high-contrast "Void Racer" theme featuring a pitch-black track with gold-leaf neon accents.
-   **Dynamic Visual FX**: 
    - Screen shake on collisions.
    - Pulse effects on shields.
    - Particle explosions for pickups and crashes.
-   **Procedural Audio System (Web Audio API)**:
    - **Dynamic Engine**: Pitch shifts based on movement speed.
    - **Police Siren**: Modulated "wee-woo" frequency oscillation.
    - **Drift Screech**: Synthesized friction noise and high-pitched rubber whine.
    - **Near Miss "Shing"**: High-frequency whistle feedback for skill maneuvers.
    - **Notification Pings**: High-tech alerts for incoming threats.

---

## 🛠️ Technical Stack

-   **Frontend**: React 19 (Functional Components & Hooks)
-   **Rendering**: HTML5 Canvas API for high-performance 60FPS gameplay.
-   **Styling**: Tailwind CSS for a sleek, modern UI.
-   **Audio**: Web Audio API for real-time sound synthesis (zero external assets).
-   **Build Tool**: Vite for lightning-fast development.

---

## 🔧 Installation

To run the game locally:

1.  **Clone the repository**:
    ```bash
    git clone https://github.com/deedmitrij/car-racing-game.git
    ```
2.  **Install dependencies**:
    ```bash
    npm install
    ```
3.  **Start the engine**:
    ```bash
    npm run dev
    ```

---

*Designed with ❤️ for young racers and retro arcade fans.*
