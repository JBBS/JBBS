#include "Sparge.h" //include the declaration for this class

Sparge::Sparge (GlobalStatus *js) {

	myDS18B20 = new DS18B20(TEMP_SPARGE);
	mashSensLevel = new SensorLevel(GPIO_MASHLOLEVEL, GPIO_MASHHILEVEL);
	jbbsStatus = js;
	Sparge::stop();

}

// --------------------------------------------------------------
// Loop
// --------------------------------------------------------------
void Sparge::loop() {

  // Leggo la temperatura dell'acqua

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
	    	 if (ready) {
	    		 status.status = READY;
	    	 }
	    	 break;
	     case READY :
			status.trend = trendOff;
			if (jbbsStatus->spargeTarget > 0 ) {
				status.status = WARMING;
			}
			break;
	     case WARMING  :
			// Controllo della temperatura
	    	 if ( status.tempActual >= jbbsStatus->spargeTarget){
	    		 status.status = HOT;
	    	 }
	    	 /* no break */
	     case HOT  :
	    	 if (jbbsStatus->spargeStart && jbbsStatus->boilReady) {
				Sparge::driveFire(Off);
				Sparge::driveBoilValve(Scarico);
	    	    status.status = SPARGING;
	    	 } else {
	    		 Sparge::driveFire( status.tempActual < jbbsStatus->spargeTarget);
	    	 }
	    	 break;
	     case SPARGING  :
			if (mashSensLevel->isLow()) {
				Sparge::driveMashValve(On);
			}
			if (mashSensLevel->isHigh()) {
				Sparge::driveMashValve(Off);
			}
	    	 break;
	}
}

// --------------------------------------------------------------
// Interpreta ed esegue i comandi MQTT propri dello sparge
// --------------------------------------------------------------
bool Sparge::execute (const char *command, const char *parameters) {

  bool success = true;

  if (COMMAND_START.compare (command) == 0) {
	  jbbsStatus->spargeTarget = atoi(parameters);
  } else if (COMMAND_STOP.compare (command) == 0) {
    Sparge::stop();
  } else if (COMMAND_READY.compare (command) == 0) {
	  ready = ( (parameters[0] == '1'));
    if (!ready) {
        Sparge::stop();
    }
  }

  return (success);

}

// --------------------------------------------------------------
// Accende o spenge il fornello
// --------------------------------------------------------------
void Sparge::driveFire(bool parameter) {

	if  (parameter) {
	  digitalWrite(GPIO_SPARGEFIRE, HIGH);
	} else {
	  digitalWrite(GPIO_SPARGEFIRE, LOW);
	}
	status.fire = parameter;
 }

// --------------------------------------------------------------
// Apre o chiude la valvola di riempimento Mash
// --------------------------------------------------------------
void Sparge::driveMashValve(bool parameter) {

	if  (parameter) {
		digitalWrite(GPIO_MASHVALVE, HIGH);
	} else {
		digitalWrite(GPIO_MASHVALVE, LOW);
	}
	status.mashValve = parameter;

 }

// --------------------------------------------------------------
// scambia la valvola di ricircolo Mash / Scarico verso Boil
// --------------------------------------------------------------
void Sparge::driveBoilValve(bool parameter) {

	if  (parameter) {
		digitalWrite(GPIO_RIC_SCA, HIGH);
	} else {
		digitalWrite(GPIO_RIC_SCA, LOW);
	}
	status.boilValve = parameter;

 }

// --------------------------------------------------------------
// Spenge tutto
// --------------------------------------------------------------

void Sparge::stop() {

  // Spengo tutto
	Sparge::driveBoilValve(Ricircolo);
	Sparge::driveMashValve(Off);
	Sparge::driveFire(Off);


   // Azzero status
	status.status				= OFF;
	status.fire   				= Off;
	status.mashValve   			= Off;
	status.boilValve  	 		= Off;
	status.trend				= trendOff;
	jbbsStatus->spargeTarget	= 0;
	jbbsStatus->spargeStart		= false;
	ready						= false;
}

// --------------------------------------------------------------
// Ritorna lo stato come stringa rappresentativa di un Json
// --------------------------------------------------------------

const std::string Sparge::getStatus() {

	json jStatus;
	jStatus["status"]	 	= status.status;
	jStatus["tempTarget"]	= jbbsStatus->spargeTarget;
	jStatus["tempActual"] 	= status.tempActual;
	jStatus["fire"]       	= status.fire;
	jStatus["mashValve"]	= status.mashValve;
	jStatus["boilValve"]	= status.boilValve;
	jStatus["trend"]		= status.trend;

	return (jStatus.dump(4));
}

double Sparge::getTempActual() {
	return (status.tempActual);
}

const char *Sparge::getStateDesc(){

	return (stateDesc[status.status]);

}

