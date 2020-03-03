/*
 * SensorLevel.h
 *
 *  Created on: 27 set 2017
 *      Author: 401993
 */

#ifndef SENSORLEVEL_H_
#define SENSORLEVEL_H_
#include <wiringPi.h> 	// Wiring PI Includes

class SensorLevel {

	int sensorGpioLow;
	int sensorGpioHigh;

public:
	SensorLevel(const int, const int);
	bool isLow();
	bool isHigh();
};

#endif /* SENSORLEVEL_H_ */
