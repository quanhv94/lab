const search = document.getElementById('search');
const items = [...document.querySelectorAll('.file')];
const count = document.getElementById('count');
const empty = document.getElementById('empty');
const itemType = document.body.dataset.itemType;

const updateItems = () => {
  const keyword = search.value.trim().toLocaleLowerCase('vi');
  let visible = 0;

  items.forEach((item) => {
    const matches = item.textContent.toLocaleLowerCase('vi').includes(keyword);
    item.hidden = !matches;

    if (matches) {
      visible += 1;
    }
  });

  count.textContent = `${visible} ${itemType}`;
  empty.hidden = visible !== 0;
};

search.addEventListener('input', updateItems);
