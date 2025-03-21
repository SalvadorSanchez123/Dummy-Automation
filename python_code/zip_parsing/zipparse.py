import sys
import csv
import zipfile
from datetime import datetime
from sortedcontainers import SortedSet
from sortedcontainers import SortedDict

uploadPath = './file_loads/zip_uploads/'
outputPath = './file_loads/csv_output/'

# oldZipPath = uploadPath + sys.argv[1]
# newZipPath = uploadPath + sys.argv[2]
# minCash = float(sys.argv[3]) if sys.argv[3] != "" else float("-inf")
# maxCash = float(sys.argv[4]) if sys.argv[4] != "" else float("inf")
# minShares = float(sys.argv[5]) if sys.argv[5] != "" else float("-inf")
# maxShares = float(sys.argv[6]) if sys.argv[6] != "" else float("inf")

outputParsed = outputPath + 'original-unsorted-data.csv'
outputCashSorted = outputPath + 'cash-sorted.csv'
outputSharesSorted = outputPath + 'shares-sorted.csv'


# Define the column lengths and headers
columns = [
    ('Owner Last Name', 40),#0:40
    ('Owner First Name', 30),#40:70
    ('Owner Address Line 1', 30),
    ('Owner Address Line 2', 30),
    ('Owner Address Line 3', 30),
    ('Owner City', 30),
    ('Owner State', 2), #192
    ('Owner Zip Code', 9),#201
    ('Holder Report Year (YYYY)', 4),#205
    ('Property Type', 4),#:209
    ('Property ID', 19),#209:228
    ('Beginning Transaction Date (MM/DD/YYYY)', 10),
    ('Ending Transaction Date (MM/DD/YYYY)', 10),
    ('Dollar Amount', 10),
    ('Number of Shares Remitted', 12),
    ('Report Date (MM/DD/YYYY)', 10),
    ('Holder Name', 40),
    ('Holder Address Line 1', 30),
    ('Holder Address Line 2', 30),
    ('Holder Address Line 3', 30),
    ('Holder City', 30),
    ('Holder State', 2),
    ('Holder Zip Code', 9),
    ('Added Date (MM/DD/YYYY)', 10),
    ('Updated Date (MM/DD/YYYY)', 10),
    ('Most Recent Claim Date (MM/DD/YYYY)', 10),
    ('Filler', 19)
]

# Define the output headers
output_headers = ['Holder', 'Report Date', 'Property Type', 'Property ID', 'Cash Remitted', 'Shares', 'First Name', 'Last Name', 'Address Line 1', 'Address Line 2', 'Address Line 3', 'City', 'State', 'Zip Code']

# Function to parse each line based on the column lengths
def parse_line(line, columns):
    parsed_data = {}
    start = 0
    for column, length in columns:
        parsed_data[column] = line[start:start+length].strip()
        start += length
    return parsed_data

# Function to convert parsed data to the desired output format
def convert_to_output_format(parsed_data):
    return [
        parsed_data['Holder Name'],                             #Holder
        parsed_data['Report Date (MM/DD/YYYY)'],                #Report Date
        parsed_data['Property Type'],                           #Property Type
        parsed_data['Property ID'],                             #Property ID
        float(parsed_data['Dollar Amount']) / 100,              #Cash Remitted    # Convert to float with 2 decimal places
        float(parsed_data['Number of Shares Remitted']) / 100,  #Shares           # Convert to float with 2 decimal places
        parsed_data['Owner First Name'],                        #First Name
        parsed_data['Owner Last Name'],                         #Last Name
        parsed_data['Owner Address Line 1'],
        parsed_data['Owner Address Line 2'],
        parsed_data['Owner Address Line 3'], #Address
        parsed_data['Owner City'],                              #City
        parsed_data['Owner State'],                             #State
        parsed_data['Owner Zip Code']                           #Zip Code
    ]

# Function to extract property IDs from a zip file
def extract_property_ids_from_zip(zip_file_path):
    property_ids = SortedSet()
    with zipfile.ZipFile(zip_file_path, 'r') as zip_ref:
        for file_name in zip_ref.namelist():
            if "_Transparency_" in file_name:
                with zip_ref.open(file_name) as file:
                    for line in file:
                        print(f"old zip Prop ID: {line.decode('utf-8')[209:228]}")
                        try:
                            property_ids.add(int(line.decode('utf-8')[209:228]))
                        except:
                            continue
    return property_ids

def generateLists(arg1, arg2, arg3, arg4, arg5, arg6):
    startTime = datetime.now()
    
    oldZipPath = uploadPath + arg1
    newZipPath = uploadPath + arg2
    minCash = float(arg3) if arg3 != "" else float("-inf")
    maxCash = float(arg4) if arg4 != "" else float("inf")
    minShares = float(arg5) if arg5 != "" else float("-inf")
    maxShares = float(arg6) if arg6 != "" else float("inf")
    
    # Extract property IDs from old zip files
    property_ids_old = extract_property_ids_from_zip(oldZipPath)
    '''
    {
        665455: {
            mainOwner: "",
            lines: [
                [ "sdljf", "sldjf", "ljsdf", ...],
                [ "sldjf", "ldf", "sldjf", ...]
            ],
            cash: 45
            shares: 0
        },
        544454:
    }
    '''
    propertyIdSortedDict = SortedDict()

    # Write the filtered data to the output CSV
    with zipfile.ZipFile(newZipPath, 'r') as zip_ref, open(outputParsed, 'w', newline='') as output_file:
        csv_writer = csv.writer(output_file)
        csv_writer.writerow(output_headers)

        for file_name in zip_ref.namelist():
            if "_Transparency_" in file_name:
                with zip_ref.open(file_name) as file:
                    for line in file:
                        try:
                            property_id_new = int(line.decode('utf-8')[209:228])
                        except:
                            continue

                        print(f"newzip Prop ID: {property_id_new}")
                        if not property_ids_old.__contains__(property_id_new):
                            parsed_data = parse_line(line.decode('utf-8'), columns)
                            dollar_amount = float(parsed_data['Dollar Amount']) / 100
                            shares = float(parsed_data['Number of Shares Remitted']) / 100

                            if (dollar_amount >= minCash and dollar_amount <= maxCash) or (shares >= minShares and shares <= maxShares):
                                # write output of unsorted properties to original file
                                output_data = convert_to_output_format(parsed_data) # array of strings of output
                                csv_writer.writerow(output_data)

                                # Group Property IDs to declare a mian owner to each of them
                                # Add to sorted dictionary of property IDs with main owner and array of repeated lines
                                propId = int(parsed_data['Property ID'])
                                mainOwner = ""
                                # main owner being e.g. "Jack Turner 123 N Bell Ave" for distinct person
                                if len(parsed_data['Owner Address Line 1']) != 0:
                                    mainOwner = " ".join([parsed_data['Owner First Name'], parsed_data['Owner Last Name'], parsed_data['Owner Address Line 1']])
                                if propertyIdSortedDict.__contains__(propId): # Already in the dictionary
                                    if propertyIdSortedDict[propId]['Main Owner'] == "":
                                        propertyIdSortedDict[propId]['Main Owner'] = mainOwner
                                    propertyIdSortedDict[propId]['Lines'].append(output_data)
                                else: # not contained in dictionary
                                    propertyIdSortedDict[propId] = {
                                        'Main Owner': mainOwner,
                                        'Lines': [output_data],
                                        'Cash': float(parsed_data['Dollar Amount']) / 100,
                                        'Shares': float(parsed_data['Number of Shares Remitted']) / 100
                                    }

    '''
    Taylor0: {
        PropertyIds: [44, 45, 46, ... ],
        cashTotal: 45446,
        sharesTotal: 3454
    }'''
    # Group by main owner and have their cash and share total summed up
    ownerExistsSortedDict = SortedDict()
    ownerEmptyDict = {}
    for id, propObj in propertyIdSortedDict.items():
        print(f"loading owner dictionary: {id}")
        if propObj['Main Owner'] == "":
            ownerEmptyDict[int(id)] = {
                'Cash': propObj['Cash'],
                'Shares': propObj['Shares']
            }
        else: # owner exists
            if ownerExistsSortedDict.__contains__(propObj['Main Owner']):
                ownerExistsSortedDict[propObj['Main Owner']]['Property Ids'].append(int(id))
                ownerExistsSortedDict[propObj['Main Owner']]['Cash Total'] += propObj['Cash']
                ownerExistsSortedDict[propObj['Main Owner']]['Shares Total'] += propObj['Shares']
            else:
                ownerExistsSortedDict[propObj['Main Owner']] = {
                    'Property Ids': [int(id)],
                    'Cash Total': propObj['Cash'],
                    'Shares Total': propObj['Shares']
                }

    sortedOwnerByCash = dict(sorted(ownerExistsSortedDict.items(), key=lambda item: item[1]['Cash Total'], reverse=True))
    sortedOwnerByShares = dict(sorted(ownerExistsSortedDict.items(), key=lambda item: item[1]['Shares Total'], reverse=True))
    print(f'Owner exists finished sorting')

    sortedEmptyOwnerByCash = dict(sorted(ownerEmptyDict.items(), key=lambda item: item[1]['Cash'], reverse=True))
    sortedEmptyOwnerByShares = dict(sorted(ownerEmptyDict.items(), key=lambda item: item[1]['Shares'], reverse=True))
    print(f'No Owner exists sorting finished')

    with open(outputCashSorted, 'w', newline='') as cash_output_file, open(outputSharesSorted, 'w', newline='') as shares_output_file:
        csv_cash_writer = csv.writer(cash_output_file)
        csv_shares_writer = csv.writer(shares_output_file)

        csv_cash_writer.writerow(output_headers)
        csv_shares_writer.writerow(output_headers)

        for mainOwner in sortedOwnerByCash:
            for propId in sortedOwnerByCash[mainOwner]['Property Ids']:
                for line in propertyIdSortedDict[propId]['Lines']:
                    print(f"writing owner cash sorted: {propId}")
                    if propertyIdSortedDict[propId]['Cash'] >= minCash:
                        csv_cash_writer.writerow(line)
        for propId in sortedEmptyOwnerByCash:
            for line in propertyIdSortedDict[propId]['Lines']:
                print(f"writing No owner cash sorted: {propId}")
                if propertyIdSortedDict[propId]['Cash'] >= minCash:
                    csv_cash_writer.writerow(line)

        for mainOwner in sortedOwnerByShares:
            for propId in sortedOwnerByShares[mainOwner]['Property Ids']:
                for line in propertyIdSortedDict[propId]['Lines']:
                    print(f"writing owner shares sorted: {propId}")
                    if propertyIdSortedDict[propId]['Shares'] >= minShares:
                        csv_shares_writer.writerow(line)
        for propId in sortedEmptyOwnerByShares:
            for line in propertyIdSortedDict[propId]['Lines']:
                print(f"writing no owner shares sorted: {propId}")
                if propertyIdSortedDict[propId]['Shares'] >= minShares:
                    csv_shares_writer.writerow(line)    

    # gather entire list
    # group property Ids in sorted dict to make faster
    # group by main owner in separate dict
    # sort by cash and shares in main owner dict
    # print to CSV of both dictionaries

    endTime = datetime.now()
    print(f'Data successfully parsed and saved to {outputParsed}')
    print(f'Start Time: {startTime}\n End Time: {endTime}')
    sys.stdout.flush()
