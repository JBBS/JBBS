/*
 * JbbsLCD.h
 *
 *  Created on: Nov 9, 2017
 *      Author: mizio
 */

#ifndef JBBSLCD_H_
#define JBBSLCD_H_

// Include di sistema
#include <cstdio>
#include <cstring>
#include <iostream>

//#include <unistd.h>
//#include <chrono>
#include <thread>

#include <wiringPi.h>
#include <lcd.h>
#include <pcf8574.h>

#include "ProgressBar.h"


class JbbsLcd {
private:

	// Variabili generali per l'LCD
	int lcdRS_;
	int lcdRW_;
	int lcdE_;
	int lcdBL_;
	int lcdDB4_;
	int lcdDB5_;
	int lcdDB6_;
	int lcdDB7_;

	uint8_t numLcdCols_ = 20;
	uint8_t numLcdRows_ = 4;

	int lcd_;

	// Temperatura Sparge
	const uint8_t rowSparge_ = 0;
	const uint8_t colSparge_ = 1;
	float tempSparge_ = 0;

	// Temperatura Mash
	const uint8_t rowMash_ = 0;
	const uint8_t colMash_ = 8;
	float tempMash_ = 0;

	// Temperatura Boil
	const uint8_t rowBoil_ = 0;
	const uint8_t colBoil_ = 15;
	float tempBoil_ = 0;

	// Step Label
	const uint8_t rowStep_ = 1;
	const char* lblStep_;

	// Progress Bar
	class ProgressBar *bar_;
	uint8_t rowBar_ = 2;
	int barPercent_;
	char barLeftlabel_[10];
	char barRightlabel_[10];

public:
	JbbsLcd(const int lcdAddress, const int gpioBase);
	void draw();
	void setTempSparge(float);
	void setTempMash(float);
	void setTempBoil(float);

	void setStepLabel(const char*);

	void setBarPercent(int);
	void setBarLeftLabel(const char*);
	void setBarRightLabel(const char*);



};
#endif /* JBBSLCD_H_ */
