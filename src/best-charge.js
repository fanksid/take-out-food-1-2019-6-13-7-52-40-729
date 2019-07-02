function bestCharge(selectedItems) {

  var countMap = groupById(selectedItems)

  var receiptDetailList = getReceiptDetailByIdMap(countMap)

  var receiptSum = getReceiptSumWithDiscount(receiptDetailList)

  return getReceiptSummaryString(receiptSum);
}

function getReceiptSummaryString(receiptSum) {
  return '============= 订餐明细 =============\n' +
    getReceiptDetailString(receiptSum) +
    '-----------------------------------\n' +
    getPromotionString(receiptSum.discount) +
    '总计：' + receiptSum.sum + '元\n' +
    '===================================';
}

function getPromotionString(params) {
  if ('promotionInfo' in params) {
    return '使用优惠:\n' +
      params.promotionInfo +
      getPromotionDetail(params) + '，省' +
      params.discountValue + '元\n' +
      '-----------------------------------\n';
  }
  return '';
}

function getPromotionDetail(params) {
  if ('discountItems' in params) {
    return '(' + params.discountItems.join('，') + ')';
  }

  return '';
}

function getReceiptDetailString(receiptSum) {
  var result = '';
  receiptSum.detailList.forEach(r => {
    result = result + r.name + ' x ' + r.count + ' = ' + r.sum + '元\n';
  });
  return result;
}


function getReceiptSumWithDiscount(receiptDetailList) {
  var receiptSum = {
    detailList: receiptDetailList,
    sum: 0,
    discount: {}
  }

  receiptDetailList.forEach(element => {
    var cost = element.price * element.count;
    element.sum = cost;
    receiptSum.sum += cost;
  });

  var bestDiscount = findBestDiscountInfo(receiptSum);

  receiptSum.discount = bestDiscount;

  if ('discountValue' in bestDiscount) {
    receiptSum.sum = receiptSum.sum - bestDiscount.discountValue;
  }
  return receiptSum
}

const findBestDiscount = function (x, y) {
  if (x.discountValue > y.discountValue) {
    return x;
  }
  return y;
};


function findBestDiscountInfo(receiptSum) {
  let promotions = loadPromotions();

  return promotions.map(calculatePromotionDiscount(receiptSum)).reduce(findBestDiscount);
}

function calculatePromotionDiscount(receiptSum) {
  return function (promotion) {
    if (promotion.type == '满30减6元' && receiptSum.sum >= 30) {
      return thirtyMinusSixPromotionInfo();
    }
    if (promotion.type == '指定菜品半价' && findIndexOfMatchPromotion(receiptSum, promotion) != -1) {
      discountedList = receiptSum.detailList
        .filter(function (params) {
          return promotion.items.indexOf(params.id) != -1;
        });

      return halfPricePromotionInfo(discountedList);
    }
    return {};
  };
}

function halfPricePromotionInfo(discountedList) {
  return {
    promotionInfo: '指定菜品半价',
    discountValue: discountedList.map(function (params) {
      return params.sum * 0.5;
    }).reduce(function (x, y) {
      return x + y;
    }),
    discountItems: discountedList.map(function (params) {
      return params.name;
    })
  };
}

function thirtyMinusSixPromotionInfo() {
  return {
    promotionInfo: '满30减6元',
    discountValue: 6
  };
}

function findIndexOfMatchPromotion(receiptSum, promotion) {
  return receiptSum.detailList.findIndex(function (params) {
    return promotion.items.indexOf(params.id) != -1;
  });
}

function getReceiptDetailByIdMap(idMap) {
  var productList = loadAllItems();
  var receiptList = [];

  idMap.forEach(function (value, key, map) {
    var product = findProduct(productList, key);
    var receipt = {
      id: product.id,
      name: product.name,
      price: product.price,
      count: value
    }
    receiptList.push(receipt);
  });

  return receiptList;
}

function groupById(params) {
  var countMap = new Map();
  params.forEach(element => {
    var { id, count } = parseIdAndCountFromId(element);
    if (countMap.has(id)) {
      count = countMap.get(id) + count;
    }

    countMap.set(id, count)
  });

  return countMap;
}


function parseIdAndCountFromId(element) {
  var count = 1;
  var id = element;
  if (element.indexOf(' x ') != -1) {
    id = element.substring(0, element.indexOf(' x '));
    count = element.substring(element.indexOf(' x ') + 3);

    count = parseInt(count);
  }

  return { id, count };
}

function findProduct(list, id) {
  for (let index = 0; index < list.length; index++) {
    if (list[index].id == id) {
      return list[index];
    }
  }
  return null;
}