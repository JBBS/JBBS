/*
 * SensorLevel.cpp
 *
 *  Created on: 27 set 2017
 *      Author: 401993
 */

#include "SensorLevel.h"

SensorLevel::SensorLevel(const int gpioLow, const int gpioHigh) {
	// TODO Auto-generated constructor stub
	// settare gpio ad input
	sensorGpioLow = gpioLow;
	sensorGpioHigh = gpioHigh;

}

// -------------------------------------------------------
// isLow ritorna:
// 			- true se il sensore del minimo e' fuori dall'acqua
//			- false  se il sensore del minimo e' immerso nell'acqua
// -------------------------------------------------------

bool SensorLevel::isLow() {

	return !(digitalRead(sensorGpioLow));

}

// -------------------------------------------------------
// isHigh ritorna:
// 			- true se il sensore del massimo e' immerso nell'acqua
//			- false  se il sensore del massimo e' fuori dall'acqua
// -------------------------------------------------------

bool SensorLevel::isHigh() {

	return (digitalRead(sensorGpioHigh));

}

SensorLevel::~SensorLevel() {
	// TODO Auto-generated destructor stub
}

