# Spec: Ozora 2026 Venue Map Upgrades

## 1. Goal Description
The purpose of this upgrade is to enhance the usability, accuracy, and security of the venue map companion at Ozora 2026, especially for offline outdoor usage in challenging environments (darkness, forest, altered states). 

We address three main challenges:
1. **Confusing GPS Startup:** Currently, the app shows "GPS unavailable" on entry without prompting or explaining why GPS is needed, leading to confusion. We will introduce an auto-request location sequence combined with a beautifully designed, informative onboarding card for users who haven't granted permission.
2. **Inaccurate Compass Orientation:** Hardware compasses can be highly inaccurate offline. We will implement a two-stage calibration system: physical sensor calibration (figure-8 motion guide) and a manual reference landmark alignment system.
3. **Lack of Trail Awareness:** The app currently calculates navigation "as the crow flies", ignoring fences, restricted zones (e.g., Backstages), and physical barriers (e.g., Lake Halomi). We will add a vector-based overlay of festival trails and restricted zones, with active intersection checking to warn users if their straight-line route crosses a restricted barrier.

---

## 2. User Review Required
> [!IMPORTANT]
> The manual compass calibration relies on calculating the difference between the user's hardware heading and the mathematical bearing to a chosen visible landmark. This requires active GPS coordinates. If GPS is unavailable, only the physical figure-8 sensor calibration can be performed.

---

## 3. Proposed Changes

### 3.1. GPS Onboarding & UI Updates (`src/components/VenueMap.jsx`)
* **Auto-Query Location:** When the map tab loads, the app will try to get the current location automatically.
* **Designed Onboarding Card:** If GPS permission is denied, unavailable, or still requesting, a dedicated, immersive glassmorphic card will replace the "Nearby" list or overlay the map.
  * **HE:** "🔮 למצוא את הדרך בתוך האורות של אוזורה"
  * **EN:** "🔮 Unlock the Ozora Lights Map"
  * Explains that GPS is crucial for finding stages, water points, and their tent in the dark offline.
  * Provides a prominent "Allow Location" button and a help dropdown with step-by-step instructions for Chrome and Safari.
* **Persistent Location status FAB:** A location button that is styled according to the permission status:
  * **Blocked/Denied:** Red pulsing warning icon. Clicking opens the troubleshooting modal/card.
  * **Granted:** Standard crosshair icon to center map on the user.

### 3.2. Two-Stage Compass Calibration (`src/components/VenueMap.jsx` & `src/utils/navigationPermissions.js`)
* **Compass Offset State:** We will introduce a `compassOffset` value stored in state and persisted in `localStorage` under `ozora_compass_offset`.
* **Sensor Calibration Guide:** Shows a CSS-animated phone performing a figure-8 motion in the air with instructions.
* **Manual Landmark Calibration:**
  * Displays the 3 nearest visible landmarks (e.g., Ozora Main Stage, Világfa, Butterfly Lookout).
  * User points the top of their phone at the physical landmark and clicks "I am facing this landmark".
  * Math:
    $$\theta_{\text{bearing}} = \text{calculateBearing}(P_{\text{user}}, P_{\text{landmark}})$$
    $$\text{offset} = (\theta_{\text{bearing}} - \theta_{\text{heading}} + 360) \pmod{360}$$
  * The offset is saved to state and `localStorage` to correct all future needle rotations:
    $$\theta_{\text{rotation}} = \theta_{\text{bearing}} - (\theta_{\text{heading}} + \text{offset})$$

### 3.3. Trail & Restricted Zone Vector Layers (`src/data/venueTrails.json`)
* **New Data File:** Create `src/data/venueTrails.json` containing:
  * `trails`: Arrays of Coordinates representing main (gold) and secondary (purple dashed) pathways.
  * `restrictedZones`: Polygon coordinates of no-go areas (e.g., Main Stage Backstage, Lake Halomi, Crew-only zones).
* **Render Layers:** Use Leaflet's `<Polyline>` and `<Polygon>` components to render the paths and restricted areas on the map.
* **Collision Warning System:**
  * A function will check if the line segment from the user's position to the selected target intersects any edge of any restricted zone polygon.
  * **CCW Intersection Check:**
    $$\text{ccw}(A, B, C) = (C_y - A_y) \cdot (B_x - A_x) > (B_y - A_y) \cdot (C_x - A_x)$$
    $$\text{intersect}(A, B, C, D) = \text{ccw}(A, C, D) \neq \text{ccw}(B, C, D) \land \text{ccw}(A, B, C) \neq \text{ccw}(A, B, D)$$
  * If an intersection is detected, display a glowing warning banner:
    ⚠️ *Warning: Your navigation path crosses a restricted area (e.g. [Zone Name]). Please use the gold-marked trails.*

---

## 4. Verification Plan

### Automated Tests
* Add unit tests to check:
  * Mathematical bearing calculations.
  * Compass offset correction logic.
  * Segment-polygon intersection checks (cases where segment crosses polygon edges, is fully inside, or does not cross).

### Manual Verification
* Simulate navigation targets crossing restricted zones to check the alert banner.
* Simulate different compass heading and location values to verify correct calibration offsets.
