import { expect, describe, it, vi, beforeEach, afterEach } from 'vitest';
import { setSelectedValues, getSelectedValues } from '../options.js';

let selectTemplate = {
  options: [
    {
      value: "0"
    },
    {
      value: "5"
    },
    {
      value: "6"
    },
    {
      value: "7"
    }
  ]
};

describe('setSelectedValues', async () => {
  

  it('should select first option', async () => {
    let select = JSON.parse(JSON.stringify(selectTemplate));
    let values = "0"
    setSelectedValues(select, values);
    
    expect(select.options[0].selected).toBeTruthy();
    expect(select.options[1].selected).toBeFalsy();
    expect(select.options[2].selected).toBeFalsy();
  });

  it('should select option with value 5', async () => {
    let select = JSON.parse(JSON.stringify(selectTemplate));
    let values = "5"
    setSelectedValues(select, values);
    
    expect(select.options[0].selected).toBeFalsy();
    expect(select.options[1].selected).toBeTruthy();
    expect(select.options[2].selected).toBeFalsy();
  });

  it('should select option with value 5 and 7', async () => {
    let select = JSON.parse(JSON.stringify(selectTemplate));
    let values = "5,7"
    setSelectedValues(select, values);
    
    expect(select.options[0].selected).toBeFalsy();
    expect(select.options[1].selected).toBeTruthy();
    expect(select.options[2].selected).toBeFalsy();
    expect(select.options[3].selected).toBeTruthy();
  });

});

describe('getSelectedValues', async () => {
  
  it('should return 0 when only all is selected', async () => {
    let select = JSON.parse(JSON.stringify(selectTemplate));
    select.options[0].selected = true;

    let values = getSelectedValues(select);
    
    expect(values).eq('0');
  });

  it('should return 0 when all and others are selected', async () => {
    let select = JSON.parse(JSON.stringify(selectTemplate));
    select.options[0].selected = true;
    select.options[1].selected = true;

    let values = getSelectedValues(select);
    
    expect(values).eq('0');
  });

  it('should return 5 when only 1 is selected', async () => {
    let select = JSON.parse(JSON.stringify(selectTemplate));
    select.options[1].selected = true;

    let values = getSelectedValues(select);
    
    expect(values).eq('5');
  });

  it('should return 5,7 when only 1 and 3 are selected', async () => {
    let select = JSON.parse(JSON.stringify(selectTemplate));
    select.options[1].selected = true;
    select.options[3].selected = true;

    let values = getSelectedValues(select);
    
    expect(values).eq('5,7');
  });

});