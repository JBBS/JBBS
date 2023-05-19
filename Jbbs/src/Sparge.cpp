#include "Sparge.h" //include the declaration for this class


Sparge::Sparge (GlobalStatus *js) {

	myDS18B20 = new DS18B20(TEMP_SPARGE);
	mashSensLevel = new SensorLevel(GPIO_MASHLOLEVEL, GPIO_MASHHILEVEL);
	boilSensLevel = new SensorLevel(GPIO_BOILHILEVEL, GPIO_BOILHILEVEL); // => Sensore livello BOIL
	jbbsStatus = js;
	Sparge::stop();

}

// --------------------------------------------------------------
// Loop
// --------------------------------------------------------------
void Sparge::loop() {

	double appoTemp;

  // Leggo la temperatura dell'acqua

 //	tempActual = myDS18B20->getTemp();
	appoTemp = myDS18B20->getTemp();

	if (appoTemp == TEMPREADERROR) {
		if (status.status != OFF) {
			std::cout << "ERROR! SPARGE Sens Temp read failed." << std::endl;
		}
	} else{
		tempActual = appoTemp;
	}


	if (tempActual > status.tempActual) {
		status.trend = trendUp;
	} else if (tempActual == status.tempActual) {
		status.trend = trendSteady;
	} else {
		status.trend = trendDown;
	}

	status.tempActual = tempActual;
	status.boilLevelHi = boilSensLevel->isHigh();

	switch(status.status) {
	     case OFF :
			status.trend = trendOff;
	    	 if (ready) {
	    		 status.status = READY;
	    	 }
	    	 break;
	     case READY:
			status.trend = trendOff;
			if (jbbsStatus->spargeWarming) {
				status.tempStart   	= status.tempActual;
				status.timeStart = time(0);
				status.status = WARMING;
			}
			break;
	     case WARMING  :
			// Controllo della temperatura
	    	 if ( status.tempActual >= SPARGETARGET){
	    		 status.status = HOT;
	    	 } else {

	    		 status.percent = 100 * ((status.tempActual - status.tempStart) /
												(SPARGETARGET - status.tempStart));

				 status.timeFinish = status.timeStart +
								((time(0) - status.timeStart) * ((SPARGETARGET - status.tempStart) /
																(status.tempActual -status.tempStart)));
	    	 }
	    	 /* no break */
	     case HOT  :
	    	 if (status.sparge && jbbsStatus->boilReady) {
				Sparge::driveFire(SPENTO);
				Sparge::driveBoilValve(SCARICO);
	    	    status.status = SPARGING;
	    	    std::cout << "[SPARGE] Inizio Sparging"  << std::endl;
	    	 } else {
	    		 Sparge::driveFire( status.tempActual < SPARGETARGET);
	    	 }
	    	 break;
	     case SPARGING  :
			if (mashSensLevel->isLow()) {
				Sparge::driveMashValve(ACCESO);
			}
			if (mashSensLevel->isHigh()) {
				Sparge::driveMashValve(SPENTO);
			}
			if (status.boilLevelHi) {									// => Sensore livello BOIL
				Sparge::stop();											// => Sensore livello BOIL
	    	    std::cout << "[SPARGE] Pentola Boil piena, fine Sparging"  << std::endl; 	// => Sensore livello BOIL
			}															// => Sensore livello BOIL

	    	 break;
	}
}

// --------------------------------------------------------------
// Interpreta ed esegue i comandi MQTT propri dello sparge
// --------------------------------------------------------------
bool Sparge::execute (const char *command, const char *parameters) {

  bool success = true;

  if (COMMAND_START.compare (command) == 0) {
	  jbbsStatus->spargeWarming = true;
  } else if (COMMAND_STOP.compare (command) == 0) {
    Sparge::stop();
  } else if (COMMAND_READY.compare (command) == 0) {
	  ready = ( (parameters[0] == '1'));
    if (!ready) {
        Sparge::stop();
    }
  } else if (COMMAND_SPARGE.compare (command) == 0) {
	  status.sparge = ( (parameters[0] == '1'));
  } else if (COMMAND_SETSTATUS.compare (command) == 0) {
    Sparge::setStatus(atoi(parameters));
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
	Sparge::driveBoilValve(RICIRCOLO);
	Sparge::driveMashValve(SPENTO);
	Sparge::driveFire(SPENTO);


   // Azzero status
	status.status				= OFF;
	status.fire   				= SPENTO;
	status.mashValve   			= SPENTO;
	status.boilValve  	 		= RICIRCOLO;
	status.boilLevelHi			= false;
	status.trend				= trendOff;
	jbbsStatus->spargeWarming	= false;
	status.sparge				= false;
	status.tempStart  		= 0;
	status.timeStart   		= 0;
	status.timeFinish  		= 0;
	status.percent			= 0;
	ready						= false;
}

// --------------------------------------------------------------
// Ritorna lo stato come stringa rappresentativa di un Json
// --------------------------------------------------------------

const std::string Sparge::getStatus() {

	json jStatus;
	jStatus["status"]	 	= status.status;
	jStatus["tempTarget"]	= SPARGETARGET;
	jStatus["tempActual"] 	= status.tempActual;
	jStatus["timeStart"] 	= status.timeStart;
	jStatus["timeFinish"] 	= status.timeFinish;
	jStatus["fire"]       	= status.fire;
	jStatus["mashValve"]	= status.mashValve;
	jStatus["boilValve"]	= status.boilValve;
	jStatus["boilLevelHi"]	= status.boilLevelHi;
	jStatus["trend"]		= status.trend;

	return (jStatus.dump(4));
}

void Sparge::setStatus(int stato){
	switch(stato) {
	     case WARMING  :
	    	 jbbsStatus->spargeWarming = true;
	    	 status.status = READY;
	    	 break;
	     case HOT  :
			 status.status = HOT;
	    	 break;
	     case SPARGING  :
	    	 status.sparge = true;
			 status.status = HOT;
	    	 break;
	}

}


double Sparge::getTempActual() {
	return (status.tempActual);
}

const char *Sparge::getStateDesc(){

	return (stateDesc[status.status]);

}
int Sparge::getPercent() {
	return (status.percent);
}
time_t *Sparge::getTimeStart() {
	return (&status.timeStart);
};
time_t *Sparge::getTimeFinish() {
	return (&status.timeFinish);
};

