/*
 * ProgressBar.h
 *
 *  Created on: Nov 9, 2017
 *      Author: mizio
 */

#ifndef PROGRESSBAR_H_
#define PROGRESSBAR_H_

#include <cstdint>
#include <stdio.h>
#include <string.h>

#include <wiringPi.h>
#include <lcd.h>
#include <pcf8574.h>

class ProgressBar {

private:

		/* Caractères personnalisés */
		uint8_t START_DIV_0_OF_1[8] = {
		  0B01111,
		  0B11000,
		  0B10000,
		  0B10000,
		  0B10000,
		  0B10000,
		  0B11000,
		  0B01111
		}; // Char début 0 / 1

		uint8_t START_DIV_1_OF_1[8] = {
		  0B01111,
		  0B11000,
		  0B10011,
		  0B10111,
		  0B10111,
		  0B10011,
		  0B11000,
		  0B01111
		}; // Char début 1 / 1

		uint8_t DIV_0_OF_2[8] = {
		  0B11111,
		  0B00000,
		  0B00000,
		  0B00000,
		  0B00000,
		  0B00000,
		  0B00000,
		  0B11111
		}; // Char milieu 0 / 2

		uint8_t DIV_1_OF_2[8] = {
		  0B11111,
		  0B00000,
		  0B11000,
		  0B11000,
		  0B11000,
		  0B11000,
		  0B00000,
		  0B11111
		}; // Char milieu 1 / 2

		uint8_t DIV_2_OF_2[8] = {
		  0B11111,
		  0B00000,
		  0B11011,
		  0B11011,
		  0B11011,
		  0B11011,
		  0B00000,
		  0B11111
		}; // Char milieu 2 / 2

		uint8_t END_DIV_0_OF_1[8] = {
		  0B11110,
		  0B00011,
		  0B00001,
		  0B00001,
		  0B00001,
		  0B00001,
		  0B00011,
		  0B11110
		}; // Char fin 0 / 1

		uint8_t END_DIV_1_OF_1[8] = {
		  0B11110,
		  0B00011,
		  0B11001,
		  0B11101,
		  0B11101,
		  0B11001,
		  0B00011,
		  0B11110
		}; // Char fin 1 / 1

		int lcd_;
		uint8_t row_;
		uint8_t col_;
		uint8_t numCols_;

		uint8_t map(uint8_t x, uint8_t in_min, uint8_t in_max, uint8_t out_min, uint8_t out_max);

	public:
		ProgressBar (int lcd, int row, int col, uint8_t numCols);
		void draw (uint8_t percent, const char* lblLeft, const char* lblRight);
};

#endif /* PROGRESSBAR_H_ */
