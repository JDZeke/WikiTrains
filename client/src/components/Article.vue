<template>
  <b-button variant="light" block squared @click="$emit('article-changed', title)">
    <b-container fluid class="ff">
      <b-row>
        <b-col cols="3">
          <b-row>
            <b-img class="articleImage" v-bind:src="imageURL" width="100" height="100"></b-img>
          </b-row>
        </b-col>
        <b-col cols="9">
          <b-row>
            <h5>
              {{title}}:
              <br />
            </h5>
            <h6>{{description}}</h6>
          </b-row>
        </b-col>
      </b-row>
    </b-container>
  </b-button>
</template>

<script>
export default {
  name: "Article",
  props: {
    title: { type: String },
    description: { type: String },
    imageURL: { type: String },
  },
};
</script>

<style scoped>
.articleImage {
  width: 80px;
  height: 80px;
  float: left;
  object-fit: cover;
  border: 1px solid black;
}
.ff {
  border: 2px solid black;
}
</style>