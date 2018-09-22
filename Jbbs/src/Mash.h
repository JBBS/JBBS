#ifndef MASH_H
#define MASH_H

// Include di sistema
#include <cstring>
#include <chrono>
#include <ctime>

#include <wiringPi.h> 	// Wiring PI Includes
//#include <PID_v1.h>     // PID Brett
#include "SimplePID.h"
#include "json.hpp" 	// Json for modern c++
using json = nlohmann::json; // for convenience

const unsigned char MAXSTEP = 10;

// Include locali
#include "JbbsCommons.h"
#include "MQTTJbbs.h"
#include "DS18B20.h"

class Mash {

	const std::string TEMP_MASH = "28.FF9285711503";
	class DS18B20* myDS18B20;
	GlobalStatus *jbbsStatus;

	bool ready 		= false;
	bool gotRecipe 	= false;
	int startStep = -1;

	struct {
	  std::string 	desc;
	  double 		temp;
	  unsigned char time = 0;
	  bool 			pump;
	} recipe[MAXSTEP];

	enum stato {
		OFF,
		READY,
		WORKING
	};
	const char* stateDesc[3] = { "Off", "Ready", "Working"};

	struct {
		stato			status		= OFF;
	   std::string  	desc		= "";
	   int          	numStep		= 0;    // indice Step nell'array Recipe
	   double       	tempStart	= 0;    // timestamp
	   double       	tempTarget	= 0;
	   double       	tempActual	= 0;
	   time_t       	timeStart	= 0;    // timestamp inizio step
	   unsigned char	timeStep	= 0;    // Step length in minuti
	   time_t       	timeFinish	= 0 ;   // timestamp fine step
	   int				percent		= 0;	// Percentuale di avanzamento step
	   bool         	pump 		= false;
	   bool         	fire 		= false;
	   bool         	warming		= false;
	   int 				trend		= 0;
       bool				alarm		= false;
	 } status;

	// commands related stuff
	const std::string COMMAND_PUMP 	= "pump";
	const std::string COMMAND_FIRE 	= "fire";
	const std::string COMMAND_LOAD 	= "load";
	const std::string COMMAND_START = "start";
	const std::string COMMAND_STOP	= "stop";
	const std::string COMMAND_READY	= "ready";

    void driveFire(bool );
    void drivePump(bool );
    bool loadSteps(const char* );
    bool start(int);
    void stop();
    void PID_setup();
    void PID_loop();

  public:
    Mash (GlobalStatus *js);
	const std::string statusTopic = "mash/status";

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

