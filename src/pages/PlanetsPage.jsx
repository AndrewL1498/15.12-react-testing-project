import { useEffect, useState } from 'react';
import SpaceTravelApi from '../services/SpaceTravelApi';
import styles from './Planets.module.css';
import Loader from '../components/Loader.jsx';
import FallBackImage from '../components/FallBackImage.jsx'

function PlanetsPage() {
  const [planets, setPlanets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [spacecrafts, setSpacecrafts] = useState([]);
  const [selectedPlanetId, setSelectedPlanetId] = useState(null);
  const [moving, setMoving] = useState(false);

  useEffect(() => {
    async function fetchData() {
      try {
        const [planetRes, spacecraftRes] = await Promise.all([
          SpaceTravelApi.getPlanets(),
          SpaceTravelApi.getSpacecrafts(),
        ]);

        // If there is no error fetching planets, map over the planet response data creating a new array with all the planets and their properties
        if (!planetRes.isError) {
            const correctedPlanets = planetRes.data.map(planet => ({...planet, CurrentPopulation: (planet.currentPopulation) }));

         setPlanets(correctedPlanets);
        } else {
          console.error('Error fetching planets:', planetRes.data);
        }

        // If there is no error fetching spacecrafts, set the spacecrafts state with the response data.
        if (!spacecraftRes.isError) {
          setSpacecrafts(spacecraftRes.data);
        } else {
          console.error('Error fetching spacecrafts:', spacecraftRes.data);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false); // Once data is fetched or an error occurs, set loading to false
      }
    }

    fetchData(); // Fetch data when the component mounts
  }, []);


async function handleMoveSpacecraft(spacecraftId) {
  if (moving) return; // If moving state is true, eject early to prevent multiple clicks
  if (selectedPlanetId === null) { // If no planet is selected, alert the user and return
    alert("Select a planet first");
    return;
  }

setMoving(true);


try {
  const res = await SpaceTravelApi.sendSpacecraftToPlanet({
    spacecraftId,
    targetPlanetId: selectedPlanetId
  });

if (res.isError){
  throw new Error (res.data.message || "Unable to move spacecraft."); // If there is an error in the response, throw an error with the message from the response or a default message.
}


// Maps over the spacecrafts state and updates the current location of the spacecraft with the id that was passed in to the function, setting it to the selected planet id.
setSpacecrafts(prev =>
  prev.map(sc =>
    sc.id === spacecraftId ? {...sc, currentLocation: selectedPlanetId } : sc
  )
);

// After successfully moving the spacecraft, fetch the updated planets to reflect the changes in population.
const planetRes = await SpaceTravelApi.getPlanets();
if (!planetRes.isError) {
  const correctedPlanets = planetRes.data.map(planet => ({...planet, CurrentPopulation: (planet.currentPopulation) }));
  setPlanets(correctedPlanets);
}
console.log(planets)

} catch(error) {
    console.error("Failed to move spacecraft:", error);
    alert(error.message || "An unexpected error occured.")
  } finally {
    setMoving(false);
  }
}

  if (loading) return <Loader />;

return (
  <div className={styles.planetsPageContainer} data-testid="planets-page">

{moving && 
 
    <Loader />
  
}

    <div className={styles.planetsSection}>
      {planets.map((planet) => (
        <div key={planet.id} className={styles.planetCard}>
          <div className={planet.id === selectedPlanetId ? styles.selectedPlanetCard : styles.planetDetails} onClick={() => setSelectedPlanetId(planet.id)}>
            <img
              src={planet.pictureUrl}
              alt={planet.name}
              className={styles.planetImage}
            />
            <h2 className={styles.planetName}>{planet.name}</h2>
            <h2>{(planet.currentPopulation)}</h2>
          </div>

          {/* If there is at least one spacecraft who's current location is equal to the planet id then create a list of spaceships assigned to earth */}
          {spacecrafts.some(sc => sc.currentLocation === planet.id) && ( //Some returns true if at least one spacecraft's current location matches the planet id. If true, render the spacecraft list.
            <div className={styles.earthSpacecraftList}>
              {spacecrafts.length > 0 ? ( //If spacecrafts length is greater than 0, filter out and create a new array of spacecrafts who's current location is equal to the current planet id. 
                spacecrafts
                .filter(sc => sc.currentLocation === planet.id)
                .map((sc) => ( //Then map over the filtered spacecrafts and create a div for each spacecraft with its name, capacity, and an image.
                  <div key={sc.id} className={styles.spacecraftItem}>
                    <FallBackImage
                      src={sc.pictureUrl}
                      alt={sc.name}
                      className={styles.spacecraftImage}
                      onClick={() => handleMoveSpacecraft(sc.id)}
                    />

                    <div className={styles.SpaceshipDetails}>
                      <p>{sc.name}</p>
                      <p>{sc.capacity}</p>
                    </div>
                  </div>
                ))
              ) : ( // If there are no spacecrafts, display a message.
                <p>No spacecrafts available.</p>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  </div>
);

}

export default PlanetsPage;

