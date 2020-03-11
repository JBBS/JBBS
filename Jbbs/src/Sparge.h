#ifndef SPARGE_H
#define SPARGE_H

// Include di sistema
#include <cstring>
#include <chrono>
#include <ctime>

#include <wiringPi.h> 		// Wiring PI Includes
//#include <PID_v1.h>     	// PID Brett

#include "json.hpp" 			// Json for modern c++
using json = nlohmann::json; 		// for convenience

// Include locali
#include "JbbsCommons.h"
#include "DS18B20.h"
#include "SensorLevel.h"

class Sparge {

	// indirizzi delle periferiche 1wire
	std::string TEMP_SPARGE = "28.FF2161921504";
	class DS18B20* myDS18B20;

	class SensorLevel* mashSensLevel;
//	class SensorLevel* boilSensLevel;   => Sensore livello BOIL
	GlobalStatus *jbbsStatus;
	double tempActual	= 0;
	int tempTarget		= 0;
	bool ready 			= false;

	// Status stuff

	enum stato {
		OFF,
		READY,
		WARMING,
		HOT,
		SPARGING
	};

	const char* stateDesc[5] = { "Off", "Ready", "Warming", "Hot", "Sparging"};

	struct {
		stato		status			= OFF;
		std::string	desc			= "";
		double      tempActual		= 0;
		bool        fire 			= false;
		bool        mashValve 		= false;
		bool        boilValve 		= false;
		int 		trend			= 0;
		bool 		sparge			= false; 	// Flag di inizio sparge da Mash a Sparge
		double      tempStart		= 0;    // timestamp
		time_t      timeStart		= 0;    // timestamp inizio step
		time_t      timeFinish		= 0 ;   // timestamp fine step
		int			percent			= 0;	// Percentuale di avanzamento step
	 } status;

	// commands related stuff

     static const int WAIT_TIME = 5; // faccio il loop ogni 5 secondi

    void driveFire(bool);
    void driveMashValve(bool);
    void driveBoilValve(bool);
    void stop();

  public:
    Sparge (GlobalStatus *js); //
	std::string statusTopic = "sparge/status";

    void loop();
    bool execute (const char *, const char *);
    const std::string getStatus ();
    const char * getStateDesc();
    double getTempActual();
    int		getPercent();
	time_t *getTimeStart();
	time_t *getTimeFinish();
};

#endif

