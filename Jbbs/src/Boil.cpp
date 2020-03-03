#include "Boil.h" //include the declaration for this class

#include <cstdlib>
#include <ctime>
#include <iostream>
#include <string>

#include "JbbsCommons.h"

Boil::Boil (GlobalStatus *js) {

	myDS18B20 = new DS18B20(TEMP_BOIL);
	jbbsStatus = js;
	Boil::stop();

}

// --------------------------------------------------------------
// Loop
// --------------------------------------------------------------
void Boil::loop() {

	double appo	= 0;    // timestamp inizio step
	double tempActual;

	const int STARTSMALLFIRE = 300; // secondi prima della partenza del fornello piccolo
	const int STARTBIGFIRE = 600; 	// secondi prima della partenza del fornello grande
	static time_t initBoil = 0;



  // Leggo la temperatura del mosto

	tempActual = myDS18B20->getTemp();

	if (tempActual > status.tempActual) {
		status.trend = trendUp;
	} else if (tempActual == status.tempActual) {
		status.trend = trendSteady;
	} else {
		status.trend = trendDown;
	}

	status.tempActual = tempActual;

	switch(status.status) {
	     case OFF :
			status.trend = trendOff;
	    	 if (jbbsStatus->boilReady && status.gotRecipe) {
	    		 status.status = READY;
	    	 }
			 break;
	     case READY :
			status.trend = trendOff;
			if (startStep >= 0) {
				Boil::start(startStep);
				initBoil = time(0);
				status.status = FILLING;
			}
			break;
	     case FILLING:
	    	 // Faccio riempire un po' il rino e accendo solo dopo STARTSMALLFIRE secondi
	    	 if ((time(0) - initBoil) > STARTSMALLFIRE) {
	    		 Boil::driveSmallFire(ACCESO);
	    	 }
	    	 // dopo STARTBIGFIRE secondi passo a preboil con tutti i fornelli accesi
	    	 if ((time(0) - initBoil) > STARTBIGFIRE) {
					status.status = PREBOIL;
	    	 }

	    	 break;
	     case PREBOIL:

	    	 // se ho raggiunto la temperatura di ebollizione, inizializzo la barra di avanzamento e passo a boil
	    	 if (status.tempActual >= boilTemp) {
				status.timeStart = time(0);
				status.timeFinish = status.timeStart + (status.timeStep * 60);
				status.percent = 0;
				status.status = BOIL;
	    	 } else {
			 // altrimenti tengo accesi i fornelli ed aggiorno la barra

	    		 Boil::driveBigFire(ACCESO);
	    		 status.percent = 100 * ((status.tempActual - status.tempStart) /
												(boilTemp - status.tempStart));

				 status.timeFinish = status.timeStart +
								((time(0) - status.timeStart) * ((boilTemp - status.tempStart) /
																(status.tempActual -status.tempStart)));
	    	 }

	    	 //
	    	 break;
	     case BOIL:

	    	 Boil::driveBigFire( status.tempActual < boilTemp );

			// controllo se ho finito la durata dello step ...
			if ( status.timeFinish <= time(0) ) {

				// Eventualmente suono allarme
				// ... se c'è passo allo step successivo ...
				if (status.CurrentStep < status.lastStep) {
					Boil::start (status.CurrentStep + 1);
				} else {
				// ... altrimenti ho finito
					Boil::stop();
				}
			} else {

				appo = time(0)- status.timeStart;
				appo /= status.timeFinish - status.timeStart;
				status.percent = 100 * appo;

			}
			break;
	}

}

// --------------------------------------------------------------
// Interpreta ed esegue i comandi MQTT propri del boil
// --------------------------------------------------------------
bool Boil::execute (const char *command, const char *parameters) {

  bool success = true;

  if (COMMAND_SMALLFIRE.compare (command) == 0) {
    Boil::driveSmallFire( (parameters[0] == '1') );
  } else if (COMMAND_BIGFIRE.compare (command) == 0) {
    Boil::driveBigFire( (parameters[0] == '1'));
  } else if (COMMAND_READY.compare (command) == 0) {
	jbbsStatus->boilReady = ( (parameters[0] == '1'));
    if (!jbbsStatus->boilReady) {
    	Boil::stop();
    }
  } else if (COMMAND_LOAD.compare (command) == 0) {
    success = Boil::loadSteps(parameters);
  } else if (COMMAND_START.compare (command) == 0) {
    startStep = atoi(parameters);
//  } else if (COMMAND_SETBOIL.compare (command) == 0) {
//    boilTemp = atoi(parameters);
  } else if (COMMAND_STOP.compare (command) == 0) {
    Boil::stop();
  }

  return (success);

}

// --------------------------------------------------------------
// Accende o spenge il fornello piccolo
// --------------------------------------------------------------
void Boil::driveSmallFire(bool parameter) {

	if  (parameter) {
	  digitalWrite(GPIO_SMALLFIRE, HIGH);
	} else {
	  digitalWrite(GPIO_SMALLFIRE, LOW);
	}
	status.smallFire = parameter;
 }

// --------------------------------------------------------------
// Accende o spenge il fornello grande
// --------------------------------------------------------------
void Boil::driveBigFire(bool parameter) {

	if  (parameter) {
		digitalWrite(GPIO_BIGFIRE, HIGH);
	} else {
		digitalWrite(GPIO_BIGFIRE, LOW);
	}

	status.bigFire = parameter;

 }


// --------------------------------------------------------------
// Carica gli step della ricetta
// !! Verificare che carichi tutto correttamente !!
// --------------------------------------------------------------
bool Boil::loadSteps (const char* parameter) {

	//	json j;
	auto jsonArray = json::parse(parameter);

	//	std::cout << ">> jsonArray: " << std::setw(4) << jsonArray << std::endl;

	int i = 0;
	for (json::iterator it = jsonArray.begin(); it != jsonArray.end(); ++it) {
		recipe[i].desc = (*it)["desc"];
		recipe[i].time = (*it)["time"];
		i++;
	}

	status.lastStep = i - 1;

	status.gotRecipe = true;
	return (true);

}

// --------------------------------------------------------------
// Spenge tutto
// --------------------------------------------------------------

void Boil::stop() {

	// Spengo tutto
	Boil::driveSmallFire(SPENTO);
	Boil::driveBigFire(SPENTO);

	// Azzero status
	status.status			= OFF;
	status.desc        		= "";
	status.CurrentStep     		= -1;
	status.tempStart  		= 0;
	status.timeStart   		= 0;
	status.timeStep    		= 0;
	status.timeFinish  		= 0;
	status.percent			= 0;
	status.smallFire   		= SPENTO;
	status.bigFire     		= SPENTO;
	jbbsStatus->boilReady 	= false;
	status.gotRecipe 		= false;
	startStep				= -1;

}

// --------------------------------------------------------
// Avvia l'elaborazione della ricetta a partire da startStep
//
// Ho adottato la convenzione che per indicare una pausa 
// utilizzo uno step con temperatura a 0, e quindi avrò
// sempre status.tempActual > status.tempTarget
// --------------------------------------------------------

bool Boil::start (int ind) {

	std::cout << ">> start: " << ind << std::endl;

	// Inizializzo currentstep
	status.desc        	= recipe[ind].desc;
	status.CurrentStep     	= ind;
	status.timeStart   	= time(0);
	status.tempStart   	= status.tempActual;
	status.timeStep    	= recipe[ind].time;

	if (status.tempActual < boilTemp) {
		status.timeFinish  = 0;
	} else {
		status.timeFinish = status.timeStart + (status.timeStep * 60);
	}
	status.percent = 0;

	return (true);

}


// --------------------------------------------------------------
// Ritorna lo stato come stringa rappresentativa di un Json
// --------------------------------------------------------------

const std::string Boil::getStatus() {

	json jStatus;
	jStatus["status"]	  = status.status;
	jStatus["step"]       = status.CurrentStep;
	jStatus["desc"]       = status.desc;
	jStatus["tempStart"]  = status.tempStart;
	jStatus["tempActual"] = status.tempActual;
	jStatus["timeStart"]  = status.timeStart;
	jStatus["timeStep"]   = status.timeStep;
	jStatus["timeFinish"] = status.timeFinish;
	jStatus["smallFire"]  = status.smallFire;
	jStatus["bigFire"]    = status.bigFire;
	jStatus["trend"]	  = status.trend;

	return (jStatus.dump(4));
}

double Boil::getTempActual() {
	return (status.tempActual);
}

int Boil::getPercent() {
	return (status.percent);
}
time_t *Boil::getTimeStart() {
	return (&status.timeStart);
};
time_t *Boil::getTimeFinish() {
	return (&status.timeFinish);
};
const char* Boil::getStateDesc(){

	switch(status.status) {
	     case OFF :
	     case READY :
	     case FILLING :
	     case PREBOIL :
			return (stateDesc[status.status]);
	    	 break;
	     case BOIL  :
	    	 return (status.desc.c_str());
	    	 break;
	}

	return ("");

}

