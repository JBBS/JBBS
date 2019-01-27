#include "Mash.h" //include the declaration for this class

double tempTarget;
double tempActual;

// Step stuff
// PID Stuff
const time_t WindowSize = 30; // 30 secondi
time_t windowStartTime = 0;
double Output = 0;

double kp = 2;  // Coefficiente proporzionale
double ki = 5;  // Coefficiente Integrale
double kd = 1;  // Coefficiente derivative;

// PID myPID(&tunTemp, &Output, &setpoint, kp, ki, kd, DIRECT);
//SimplePID myPID( &(status.tempActual), &Output, &(status.tempTarget), kp, ki, kd, DIRECT);
SimplePID myPID( &(tempActual), &Output, &(tempTarget), kp, ki, kd, DIRECT);

Mash::Mash (GlobalStatus *js) {

	myDS18B20 = new DS18B20(TEMP_MASH);
	jbbsStatus = js;
	Mash::stop();

}

// --------------------------------------------------------------
// Loop
// --------------------------------------------------------------
void Mash::loop() {

	double appo	= 0;    // timestamp inizio step
	int ret = 0;

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
	    	 if (status.ready && status.gotRecipe) {
	    		 status.status = READY;
	    	 }
			 break;
	    	 /* no break */
	     case READY :
			status.trend = trendOff;
			if (startStep >= 0) {
				Mash::start(startStep);
				status.status = WORKING;
			}
			break;
	     case WORKING  :

			PID_loop();

			// se manca meno di un'ora, faccio partire il riscaldamento del
			// tino di sparge

			if (time2Finish() <= 60 && jbbsStatus->spargeTarget <= 0) {

				if ((ret=jbbsStatus->mqttClient->publish(NULL, spargeStartCommand.c_str(), 2, "70", 2))) {

					std::cout << "Problema nell'invio del messaggio di inizio riscaldamento Sparge. Return code: " << ret << std::endl;
					std::cout << "\t Topic: |" << spargeStartCommand << "|" << std::endl;
					std::cout << "\t Length=" << 2 << std::endl;
					std::cout << "\t Payload=|" << "70" << "|" << std::endl;
				}

			}

			// Se sto riscaldando ...
			if (status.warming) {

				// Unificare indicando la fine step comprensiva di riscaldamento e mantenimento

				// ... e ho raggiunto la temperatura target, inizio a contare la durata dello step
				if (status.tempActual >= status.tempTarget) {
					status.warming = false;
					status.timeStart = time(0);
					status.timeFinish = status.timeStart + (status.timeStep * 60);
					status.percent = 0;

				} else {
					// Altrimenti do una stima della fine del riscaldamento
					if ( (status.tempActual -status.tempStart) > 0 ) {
						status.percent = 100 * ((status.tempActual - status.tempStart) /
													(status.tempTarget - status.tempStart));

						status.timeFinish = status.timeStart +
										((time(0) - status.timeStart) * ((status.tempTarget - status.tempStart) /
																				(status.tempActual -status.tempStart)));
					}
				}
			} else {
				// ... altrimenti, controllo se ho finito la durata dello step ...
				if ( status.timeFinish <= time(0) ) {
					// ... se c'è passo allo step successivo ...
					if (status.currentStep < status.lastStep) {
						Mash::start (status.currentStep + 1);
					} else {
						// ... altrimenti ho finito e lancio lo sparge ed il boil
//						jbbsStatus->spargeStart = true;
						if ((ret=jbbsStatus->mqttClient->publish(NULL, spargeSpargeCommand.c_str(), 1, "1", 2))) {

							std::cout << "Problema nell'invio del messaggio di inizio Sparge. Return code: " << ret << std::endl;
							std::cout << "\t Topic: |" << spargeSpargeCommand << "|" << std::endl;
							std::cout << "\t Length=" << 1 << std::endl;
							std::cout << "\t Payload=|" << "1" << "|" << std::endl;
						}

						// Quando lancio il boil, gli passo anche la sua ricetta
						if ((ret=jbbsStatus->mqttClient->publish(NULL, boilLoadCommand.c_str(), strlen(boilRecipe), boilRecipe, 2))) {

							std::cout << "Problema nell'invio del messaggio di inizio Boil. Return code: " << ret << std::endl;
							std::cout << "\t Topic: |" << boilLoadCommand << "|" << std::endl;
							std::cout << "\t Length=" << strlen(boilRecipe) << std::endl;
							std::cout << "\t Payload=|" << boilRecipe << "|" << std::endl;
						}
						if ((ret=jbbsStatus->mqttClient->publish(NULL, boilStartCommand.c_str(), 1, "0", 2))) {

							std::cout << "Problema nell'invio del messaggio di inizio Boil. Return code: " << ret << std::endl;
							std::cout << "\t Topic: |" << boilStartCommand << "|" << std::endl;
							std::cout << "\t Length=" << 1 << std::endl;
							std::cout << "\t Payload=|" << "0" << "|" << std::endl;
						}
						Mash::stop();
					}
				} else {

					appo = time(0)- status.timeStart;
					appo /= status.timeFinish - status.timeStart;
					status.percent = 100 * appo;

				}
			}
	}

}

// --------------------------------------------------------------
// Interpreta ed esegue i comandi MQTT propri del mash
// --------------------------------------------------------------
bool Mash::execute (const char *command, const char *parameters) {

  bool success = true;

  if (COMMAND_PUMP.compare (command) == 0) {
    Mash::drivePump( (parameters[0] == '1') );
  } else if (COMMAND_FIRE.compare (command) == 0) {
    Mash::driveFire( (parameters[0] == '1'));
  } else if (COMMAND_READY.compare (command) == 0) {
	  status.ready = ( (parameters[0] == '1'));
    if (!status.ready) {
        Mash::stop();
    }
  } else if (COMMAND_LOAD.compare (command) == 0) {
    success = Mash::loadSteps(parameters);
  } else if (COMMAND_LOADBOIL.compare (command) == 0) {
    strcpy(boilRecipe, parameters);
  } else if (COMMAND_START.compare (command) == 0) {
    startStep = atoi(parameters);
  } else if (COMMAND_STOP.compare (command) == 0) {
    Mash::stop();
  }

  return (success);

}

// --------------------------------------------------------------
// Accende o spenge il fornello
// --------------------------------------------------------------
void Mash::driveFire(bool parameter) {

	if  (parameter) {
	  digitalWrite(GPIO_MASHFIRE, HIGH);
	} else {
	  digitalWrite(GPIO_MASHFIRE, LOW);
	}
	status.fire = parameter;
 }

// --------------------------------------------------------------
// Accende o spenge la pompa
// --------------------------------------------------------------
void Mash::drivePump(bool parameter) {

	if  (parameter) {
		digitalWrite(GPIO_PUMP, HIGH);
	} else {
		digitalWrite(GPIO_PUMP, LOW);
	}

	status.pump = parameter;

 }

// --------------------------------------------------------------
// Carica gli step della ricetta
// !! Verificare che carichi tutto correttamente !!
// --------------------------------------------------------------
bool Mash::loadSteps (const char* parameter) {

	//	json j;
	auto jsonArray = json::parse(parameter);

	//	std::cout << ">> jsonArray: " << std::setw(4) << jsonArray << std::endl;

	int i = 0;
	for (json::iterator it = jsonArray.begin(); it != jsonArray.end(); ++it) {
		recipe[i].desc = (*it)["desc"];
		recipe[i].temp = (*it)["temp"];
		recipe[i].time = (*it)["time"];
		recipe[i].pump = (*it)["pump"];
		i++;
	}

	status.lastStep = i - 1;

	status.gotRecipe = true;
	return (true);

}

// --------------------------------------------------------------
// Spenge tutto
// --------------------------------------------------------------

void Mash::stop() {

	// Spengo tutto
	Mash::drivePump(SPENTO);
	Mash::driveFire(SPENTO);

	// Azzero status
	status.status		= OFF;
	status.desc        = "";
	status.currentStep = -1;
	status.tempStart   = 0;
	status.tempTarget  = 0;
	status.timeStart   = 0;
	status.timeStep    = 0;
	status.timeFinish  = 0;
	status.percent		= 0;
	status.pump        	= SPENTO;
	status.fire     	= SPENTO;
	status.warming   	= false;
	status.alarm		= false;
	status.gotRecipe	= false;
	status.ready		= false;
	startStep			= -1;

}

// --------------------------------------------------------
// Avvia l'elaborazione della ricetta a partire da startStep
//
// Ho adottato la convenzione che per indicare una pausa 
// utilizzo uno step con temperatura a 0, e quindi avrò
// sempre status.tempActual > status.tempTarget
// --------------------------------------------------------

bool Mash::start (int ind) {

	std::cout << ">> start: " << ind << std::endl;

	// Inizializzo currentstep
	status.desc        	= recipe[ind].desc;
	status.currentStep  = ind;
	status.pump        	= recipe[ind].pump;
	status.timeStart   	= time(0);
	status.tempStart   	= status.tempActual;
	status.tempTarget  	= recipe[ind].temp;
	tempTarget			= recipe[ind].temp;
	status.timeStep    	= recipe[ind].time;

	if (status.tempActual < status.tempTarget) {
		status.timeFinish  = 0;
		status.warming     = true;
	} else {
		status.timeFinish = status.timeStart + (status.timeStep * 60);
		status.warming     = false;
	}
	status.percent = 0;

	// Faccio eventualmente partire la pompa
	Mash::drivePump(status.pump );

	// Inzializzo il PID. Partirà poi in loop().
	Mash::PID_setup();

	return (true);

}

void Mash::PID_setup() {

	windowStartTime = time(0);

	//tell the PID to range between 0 and the full window size
	myPID.SetOutputLimits(0, WindowSize);

	//turn the PID on
	myPID.SetMode(AUTOMATIC);

}

void Mash::PID_loop() {

	myPID.Compute();

	// ************************************************
	// turn the output pin on/off based on pid output
	// ************************************************
	if ( (time(0) - windowStartTime) > WindowSize) {
		//time to shift the Relay Window
		windowStartTime += WindowSize;
	}

	// Accendo il fornello solo se è accesa anche la pompa
	if ( (Output >= (time(0) - windowStartTime) ) && status.pump ) {
		Mash::driveFire (ACCESO);
	} else {
		Mash::driveFire (SPENTO);
	}

}

// --------------------------------------------------------------
// Ritorna lo stato come stringa rappresentativa di un Json
// --------------------------------------------------------------

const std::string Mash::getStatus() {

	json jStatus;
	jStatus["status"]	  = status.status;
	jStatus["step"]       = status.currentStep;
	jStatus["desc"]       = status.desc;
	jStatus["tempStart"]  = status.tempStart;
	jStatus["tempTarget"] = status.tempTarget;
	jStatus["tempActual"] = status.tempActual;
	jStatus["timeStart"]  = status.timeStart;
	jStatus["timeStep"]   = status.timeStep;
	jStatus["timeFinish"] = status.timeFinish;
	jStatus["fire"]       = status.fire;
	jStatus["pump"]       = status.pump;
	jStatus["warming"]    = status.warming;
	jStatus["trend"]	  = status.trend;

	return (jStatus.dump(4));
}

double Mash::getTempActual() {
	return (status.tempActual);
}

int Mash::getPercent() {
	return (status.percent);
}
time_t *Mash::getTimeStart() {
	return (&status.timeStart);
};
time_t *Mash::getTimeFinish() {
	return (&status.timeFinish);
};
const char* Mash::getStateDesc(){

	switch(status.status) {
	     case OFF :
			return (stateDesc[status.status]);
	    	 break;
	     case READY :
			return (stateDesc[status.status]);
	    	 break;
	     case WORKING  :
	    	 return (status.desc.c_str());
	    	 break;
	}

	return ("");

}

int Mash::time2Finish() {
	// devo sommare tempo a fine step + durata step successive + differenza
	// di temperatura tra quella attuale e quella dell'ultima step.

	int t2f = 0;

	// sommo la durata in minuti di tutte le rimanenti step
	for (int i = status.currentStep+1; i <= status.lastStep; i++) {
		t2f += recipe[i].time;
	}

	// aggiugo la differenza di temperatura quella attuale e quella dell'ultima step
	// considero che ci voglia un minuto per elevare la T° di un grado
	t2f += (recipe[status.lastStep].temp - status.tempActual);

	// Aggiungo il tempo che ci vuole alla fine della step attuale

	t2f += ((status.timeFinish - time(0) / 60));

	return (t2f);

}

