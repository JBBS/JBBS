#ifndef BOIL_H
#define BOIL_H

// Include di sistema
#include <cstring>
#include <chrono>
#include <ctime>

#include <wiringPi.h> 	// Wiring PI Includes
//#include <PID_v1.h>     // PID Brett
#include "json.hpp" 	// Json for modern c++
using json = nlohmann::json; // for convenience

// Include locali
#include "JbbsCommons.h"
#include "MQTTJbbs.h"
#include "DS18B20.h"

class Boil {

	const std::string TEMP_BOIL = "28.59B04D000000";
	class DS18B20* myDS18B20;
	GlobalStatus *jbbsStatus;

	double boilTemp = 99.5; // Temperatura di ebollizione, modificabile al volo con messaggio MQTT COMMAND_SETBOIL

	int 	startStep = -1;

	struct {
	  std::string 	desc;
	  unsigned char time = 0;
	} recipe[MAXSTEP];

	enum stato {
		OFF,
		READY,
		FILLING,
		PREBOIL,
		BOIL
	};
	const char* stateDesc[5] = { "Off", "Ready", "Filling", "Pre Boil", "Boil"};

	struct {
		stato			status		= OFF;
		std::string  	desc		= "";
		int          	CurrentStep		= 0;    // indice Step nell'array Recipe
		double       	tempStart	= 0;    // timestamp
		double       	tempActual	= 0;
		time_t       	timeStart	= 0;    // timestamp inizio step
		unsigned char	timeStep	= 0;    // Step length in minuti
		time_t       	timeFinish	= 0 ;   // timestamp fine step
		int				percent		= 0;	// Percentuale di avanzamento step
		bool         	bigFire		= false;
		bool         	smallFire	= false;
//		bool         	warming		= false; // Segnala se stiamo portando a bollitura (true) o se sta già bollendo (false)
		int 			trend		= 0;
//		bool			alarm		= false;
		bool 			gotRecipe 	= false; // Flag caricamento ricetta
		unsigned char 	lastStep	= 0; 	 // Indice ultimo step
	 } status;

	// commands related stuff
	void driveSmallFire(bool );
	void driveBigFire(bool );
	bool loadSteps(const char* );
	bool start(int);
	void stop();

  public:
    Boil (GlobalStatus *js);
	const std::string statusTopic = "boil/status";

    void 	loop();
    bool 	execute (const char *, const char *);
    const 	std::string getStatus ();
    double 	getTempActual();
    int		getPercent();
    time_t *getTimeStart();
    time_t *getTimeFinish();
    const char* getStateDesc();
};

#endif
